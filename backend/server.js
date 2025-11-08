import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import cron from 'node-cron';
import http from 'http';

import { canonicalStringify, sha256Hex, toDayKey } from './src/crypto-utils.js';
import { buildMerkleRoot } from './src/merkle.js';

import Reading from './src/models/Reading.js';
import Anchor from './src/models/Anchor.js';
import User from './src/models/User.js';
import Device from './src/models/Device.js';
import FarmerDayAudit from './src/models/FarmerDayAudit.js';

import authRoutes from './src/routes/auth.js';
import deviceRoutes from './src/routes/devices.js';
import adminRoutes from './src/routes/admin.js';
import { authOptional, authRequired, requireAdmin } from './src/middleware/auth.js';

import { verifyFarmerWindowSelectivePurge, verifyAllFarmersWindowSelectivePurge } from './src/services/integrity.js';
import { router as dashboardRoutes } from './src/routes/dashboard.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const WITNESS_URLS = (process.env.WITNESS_URLS || '').split(',').map(s => s.trim()).filter(Boolean);
const ANCHOR_QUORUM = parseInt(process.env.ANCHOR_QUORUM || '2', 10);
const RAW_RETENTION_DAYS = parseInt(process.env.RAW_RETENTION_DAYS || '90', 10);
const VERIFY_WINDOW_DAYS = parseInt(process.env.VERIFY_WINDOW_DAYS || '20', 10);

await mongoose.connect(MONGO_URI);

// --- Helpers ---
function httpPostJson(url, body) {
  return new Promise((resolve, reject) => {
    try {
      const u = new URL(url);
      const data = Buffer.from(JSON.stringify(body));
      const opts = {
        method: 'POST',
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: u.pathname,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      };
      const req = http.request(opts, (res) => {
        let raw = '';
        res.on('data', (d) => raw += d.toString());
        res.on('end', () => {
          try { resolve(JSON.parse(raw)); } catch (e) { resolve({ status: res.statusCode, body: raw }); }
        });
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    } catch (e) { reject(e); }
  });
}

// --- Auth & Admin routes ---
app.use('/api/auth', authRoutes);
app.use('/api/devices', authRequired, deviceRoutes);
app.use('/api/admin', authRequired, requireAdmin, adminRoutes);

// Dashboard routes (trust score, history, etc.)
app.use('/api/dashboard', authRequired, dashboardRoutes);

// --- Ingest a sensor reading (must be from registered device) ---
app.post('/api/ingest', async (req, res) => {
  try {
    const { payload, deviceId } = req.body;
    if (!payload) return res.status(400).json({ error: 'payload required' });
    if (!deviceId) return res.status(400).json({ error: 'deviceId required' });

    const device = await Device.findOne({ deviceId }).lean();
    if (!device) return res.status(404).json({ error: 'unknown_device' });

    const ts = payload.timestamp ? new Date(payload.timestamp) : new Date();
    const dayKey = toDayKey(ts);
    const canonical = canonicalStringify(payload);
    const leafHash = sha256Hex(canonical);

    const doc = await Reading.create({
      payload,
      leafHash,
      ts,
      dayKey,
      farmerId: device.farmerId,
      deviceId: device.deviceId
    });
    return res.json({ ok: true, id: doc._id, leafHash, dayKey });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'ingest_failed' });
  }
});

import fs from 'fs';
import path from 'path';

app.post('/api/ingest-bulk', async (req, res) => {
  try {
    const filePath = path.join(process.cwd(), 'data', 'ksdev002-21days.json');

    if (!fs.existsSync(filePath)) {
      return res.status(400).json({ error: 'file_not_found' });
    }

    const fileData = fs.readFileSync(filePath, 'utf-8');
    const items = JSON.parse(fileData);

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'no_records_in_file' });
    }

    const deviceIds = [...new Set(items.map(i => i.deviceId))];
    const devices = await Device.find({ deviceId: { $in: deviceIds } }).lean();
    const deviceMap = new Map(devices.map(d => [d.deviceId, d]));

    const docs = [];

    for (const item of items) {
      const { payload, deviceId } = item;
      if (!payload || !deviceId) continue;

      const device = deviceMap.get(deviceId);
      if (!device) continue;

      const ts = payload.timestamp ? new Date(payload.timestamp) : new Date();
      const dayKey = toDayKey(ts);
      const canonical = canonicalStringify(payload);
      const leafHash = sha256Hex(canonical);

      docs.push({
        payload,
        leafHash,
        ts,
        dayKey,
        farmerId: device.farmerId,
        deviceId: device.deviceId
      });
    }

    if (docs.length === 0) {
      return res.status(400).json({ error: 'no_valid_records' });
    }

    const inserted = await Reading.insertMany(docs);
    return res.json({ ok: true, count: inserted.length });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'ingest_bulk_failed' });
  }
});




// --- Status for last 30 days (global) ---
app.get('/api/status/30days', async (req, res) => {
  try {
    const days = [];
    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      d.setUTCDate(d.getUTCDate() - i);
      days.push(toDayKey(d));
    }
    const anchors = await Anchor.find({ dayKey: { $in: days } }).lean();
    const map = new Map(anchors.map(a => [a.dayKey, a]));
    const result = days.reverse().map(dayKey => {
      const a = map.get(dayKey);
      return {
        dayKey,
        anchored: !!a,
        quorumMet: !!a?.quorumMet,
        tampered: !!a?.tampered,
        signatures: a ? a.signatures.length : 0
      };
    });
    res.json({ days: result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'status_failed' });
  }
});

// --- Verify a payload against the anchored root (server builds tree for that day) ---
app.post('/api/verify', async (req, res) => {
  try {
    const { payload } = req.body;
    if (!payload) return res.status(400).json({ error: 'payload required' });

    const ts = payload.timestamp ? new Date(payload.timestamp) : null;
    if (!ts) return res.status(400).json({ error: 'payload.timestamp required' });

    const dayKey = toDayKey(ts);

    const anchor = await Anchor.findOne({ dayKey }).lean();
    if (!anchor) return res.json({ consistent: false, reason: 'no_anchor_for_day' });

    const leaves = await Reading.find({ dayKey }).select('leafHash').lean();
    if (leaves.length === 0) return res.json({ consistent: false, reason: 'no_leaves_for_day' });

    const computedRoot = buildMerkleRoot(leaves.map(l => l.leafHash));
    const leaf = sha256Hex(canonicalStringify(payload));

    const leafExists = leaves.some(l => l.leafHash === leaf);
    const rootMatches = computedRoot === anchor.merkleRoot;

    const quorumMet = !!anchor.quorumMet;
    const validSigs = anchor.signatures?.length || 0;

    res.json({
      consistent: leafExists && rootMatches,
      quorumMet,
      validSigs,
      needed: ANCHOR_QUORUM,
      anchorRoot: anchor.merkleRoot,
      computedRoot,
      dayKey
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'verify_failed' });
  }
});

// --- Cron: daily anchor of yesterday (runs every 5 minutes) ---
cron.schedule('*/5 * * * *', async () => {
  try {
    const now = new Date();
    const y = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    y.setUTCDate(y.getUTCDate() - 1);
    const dayKey = toDayKey(y);

    const exists = await Anchor.findOne({ dayKey }).lean();
    if (exists) return;

    const leaves = await Reading.find({ dayKey }).select('leafHash').lean();
    if (leaves.length === 0) return;

    const root = buildMerkleRoot(leaves.map(l => l.leafHash));

    const sigs = [];
    for (const url of WITNESS_URLS) {
      try {
        const resp = await httpPostJson(url, { dayKey, merkleRoot: root });
        if (resp && resp.signature && resp.publicKey) {
          sigs.push({ witnessUrl: url, publicKey: resp.publicKey, signature: resp.signature });
        }
      } catch (e) {
        console.warn('witness error', url, e.message);
      }
    }
    const quorumMet = sigs.length >= ANCHOR_QUORUM;

    await Anchor.create({ dayKey, merkleRoot: root, signatures: sigs, quorumMet, tampered: false });
    console.log(`[anchor] anchored ${dayKey} root=${root} sigs=${sigs.length}`);
  } catch (e) {
    console.error('anchor_cron_failed', e);
  }
});

// --- Cron: GLOBAL RAW retention cleanup (nightly) ---
cron.schedule('0 2 * * *', async () => {
  try {
    if (RAW_RETENTION_DAYS <= 0) return;
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - RAW_RETENTION_DAYS);
    const resDel = await Reading.deleteMany({ ts: { $lt: cutoff } });
    console.log(`[retention] removed ${resDel.deletedCount} old readings`);
  } catch (e) {
    console.error('retention_failed', e);
  }
});

// --- Cron: Farmer selective purge (3:30 UTC) ---
cron.schedule('30 3 * * *', async () => {
  try {
    await verifyAllFarmersWindowSelectivePurge({ days: VERIFY_WINDOW_DAYS });
  } catch (e) {
    console.error('selective_purge_failed', e);
  }
});

// Temporary debug route - DO NOT enable in production
app.post('/api/debug/anchor-now', async (req, res) => {
  try {
    const now = new Date();
    const y = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    y.setUTCDate(y.getUTCDate() - 1);
    const dayKey = toDayKey(y);

    const exists = await Anchor.findOne({ dayKey }).lean();
    if (exists) return res.json({ ok: false, message: 'already anchored', dayKey });

    const leaves = await Reading.find({ dayKey }).select('leafHash').lean();
    if (leaves.length === 0) return res.json({ ok: false, message: 'no data to anchor', dayKey });

    const root = buildMerkleRoot(leaves.map(l => l.leafHash));

    const sigs = [];
    for (const url of WITNESS_URLS) {
      const resp = await httpPostJson(url, { dayKey, merkleRoot: root });
      if (resp?.signature) sigs.push(resp);
    }

    const quorumMet = sigs.length >= ANCHOR_QUORUM;
    const doc = await Anchor.create({ dayKey, merkleRoot: root, signatures: sigs, quorumMet });

    res.json({ ok: true, anchored: doc });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'anchor_failed' });
  }
});

app.post('/api/debug/run-purge', async (req, res) => {
  try {
    const out = await verifyAllFarmersWindowSelectivePurge({ days: VERIFY_WINDOW_DAYS });
    res.json({ ok: true, result: out });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'purge_failed' });
  }
});

app.post('/api/debug/cleanup-now', async (req, res) => {
  try {
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - RAW_RETENTION_DAYS);
    const result = await Reading.deleteMany({ ts: { $lt: cutoff } });
    res.json({ ok: true, deleted: result.deletedCount });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'cleanup_failed' });
  }
});

//--TEST--
app.post('/api/debug/anchor-each', async (req, res) => {
  try {
    // get all unique dayKeys from readings
    const dayKeys = await Reading.distinct('dayKey');

    const results = [];

    for (const dayKey of dayKeys) {
      // skip if anchor already exists for that day
      const exists = await Anchor.findOne({ dayKey }).lean();
      if (exists) {
        results.push({ dayKey, skipped: true, reason: 'already anchored' });
        continue;
      }

      // fetch all readings for that day
      const leaves = await Reading.find({ dayKey }).select('leafHash').lean();
      if (leaves.length === 0) {
        results.push({ dayKey, skipped: true, reason: 'no readings' });
        continue;
      }

      // build merkle root (in your test each leaf array has length = 1)
      const root = buildMerkleRoot(leaves.map(l => l.leafHash));

      // collect witness signatures
      const sigs = [];
      for (const url of WITNESS_URLS) {
        const resp = await httpPostJson(url, { dayKey, merkleRoot: root });
        if (resp?.signature) sigs.push(resp);
      }

      const quorumMet = sigs.length >= ANCHOR_QUORUM;

      const doc = await Anchor.create({
        dayKey,
        merkleRoot: root,
        signatures: sigs,
        quorumMet
      });

      results.push({ dayKey, anchored: true, root, quorumMet });
    }

    res.json({ ok: true, results });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'anchor_failed' });
  }
});



app.listen(PORT, () => console.log(`Backend listening on http://localhost:${PORT}`));