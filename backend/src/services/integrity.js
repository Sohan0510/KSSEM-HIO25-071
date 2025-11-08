import Anchor from '../models/Anchor.js';
import Reading from '../models/Reading.js';
import User from '../models/User.js';
import FarmerDayAudit from '../models/FarmerDayAudit.js';
import { buildMerkleRoot } from '../merkle.js';
import { canonicalStringify, sha256Hex, toDayKey } from '../crypto-utils.js';

// Utility: build list of last N days (excluded today unless includeToday: true)
function lastNDaysKeys(n, { includeToday = false } = {}) {
  const keys = [];
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const from = includeToday ? 0 : 1;
  for (let i = from; i < from + n; i++) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() - i);
    keys.push(toDayKey(d));
  }
  return keys.reverse();
}

// Global root verify: check Merkle root integrity regardless of farmer
async function verifyDayGlobal(dayKey) {
  const anchor = await Anchor.findOne({ dayKey }).lean();
  if (!anchor) return { status: 'pending_anchor' };

  const leaves = await Reading.find({ dayKey }).select('leafHash').lean();
  if (!leaves.length) return { status: 'pending_anchor' };

  const computedRoot = buildMerkleRoot(leaves.map(l => l.leafHash));
  const rootMatches = computedRoot === anchor.merkleRoot;

  if (!rootMatches) {
    await Anchor.updateOne(
      { dayKey },
      { $set: { tampered: true, tamperInfo: { reason: 'root_mismatch', computedRoot } } }
    );
    return { status: 'global_tamper', computedRoot, anchorRoot: anchor.merkleRoot };
  }

  return { status: 'clean', anchorRoot: anchor.merkleRoot };
}

// Farmer-level day verification
async function verifyFarmerDay(farmerId, dayKey) {
  const global = await verifyDayGlobal(dayKey);
  if (global.status === 'global_tamper') return { status: 'global_tamper', details: global };
  if (global.status === 'pending_anchor') return { status: 'pending_anchor' };

  const readings = await Reading.find({ farmerId, dayKey }).lean();
  if (!readings.length) return { status: 'clean_no_data' };

  for (const r of readings) {
    const leaf = sha256Hex(canonicalStringify(r.payload));
    if (leaf !== r.leafHash) {
      return { status: 'kept_tampered', details: { reason: 'payload_leaf_mismatch', readingId: r._id } };
    }
  }

  return { status: 'clean' };
}

// Hard-delete clean day
async function purgeFarmerDayHard(farmerId, dayKey) {
  const res = await Reading.deleteMany({ farmerId, dayKey });
  await FarmerDayAudit.updateOne(
    { farmerId, dayKey },
    { $set: { status: 'clean_purged', details: { deletedCount: res.deletedCount } } },
    { upsert: true }
  );
  return res.deletedCount;
}

async function keepFarmerDayTampered(farmerId, dayKey, details) {
  await FarmerDayAudit.updateOne(
    { farmerId, dayKey },
    { $set: { status: 'kept_tampered', details } },
    { upsert: true }
  );
}

// Main function: run selective purge for single farmer
export async function verifyFarmerWindowSelectivePurge({ farmerId, days }) {
  const dayKeys = lastNDaysKeys(days);
  const out = [];

  for (const dayKey of dayKeys) {
    const result = await verifyFarmerDay(farmerId, dayKey);

    if (result.status === 'clean') {
      const deleted = await purgeFarmerDayHard(farmerId, dayKey);
      out.push({ dayKey, action: 'purged', deleted });

    } else if (result.status === 'global_tamper') {
      await FarmerDayAudit.updateOne(
        { farmerId, dayKey },
        { $set: { status: 'global_tamper', details: result.details } },
        { upsert: true }
      );
      out.push({ dayKey, action: 'kept_global_tamper' });

    } else if (result.status === 'pending_anchor') {
      await FarmerDayAudit.updateOne(
        { farmerId, dayKey },
        { $set: { status: 'pending_anchor' } },
        { upsert: true }
      );
      out.push({ dayKey, action: 'pending_anchor' });

    } else if (result.status === 'kept_tampered') {
      await keepFarmerDayTampered(farmerId, dayKey, result.details);
      out.push({ dayKey, action: 'kept_farmer_tampered', details: result.details });

    } else if (result.status === 'clean_no_data') {
      out.push({ dayKey, action: 'no_data' });
    }
  }

  return { farmerId, window: dayKeys, result: out };
}

// Cron / Admin: run for all farmers
export async function verifyAllFarmersWindowSelectivePurge({ days }) {
  const farmers = await User.find({ role: 'farmer' }).select('_id').lean();
  const reports = [];
  for (const f of farmers) {
    const r = await verifyFarmerWindowSelectivePurge({ farmerId: f._id, days });
    reports.push(r);
  }
  return { ok: true, reports };
}
