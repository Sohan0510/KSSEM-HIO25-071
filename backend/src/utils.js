// Convert audit/tamper states into readable UI values
export function readableStatus(status) {
  switch (status) {
    case 'clean_purged': return '✅ Clean (Purged)';
    case 'kept_tampered': return '❌ Tampered (Preserved)';
    case 'global_tamper': return '⛔ Global Tamper';
    case 'pending_anchor': return '⌛ Awaiting Anchor';
    case 'clean_no_data': return '— No Data';
    default: return status;
  }
}

// Calculate trust score from audit logs
export function computeTrustScore(records) {
  const relevant = records.filter(r => ['clean_purged', 'kept_tampered', 'global_tamper'].includes(r.status));
  if (!relevant.length) return 1.0;
  const clean = relevant.filter(r => r.status === 'clean_purged').length;
  return clean / relevant.length;
}
