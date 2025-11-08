import crypto from 'crypto';


export function canonicalStringify(value) {
if (value === null || typeof value !== 'object') return JSON.stringify(value);
if (Array.isArray(value)) return '[' + value.map(v => canonicalStringify(v)).join(',') + ']';
const keys = Object.keys(value).sort();
return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalStringify(value[k])).join(',') + '}';
}


export function sha256Hex(str) {
return crypto.createHash('sha256').update(str).digest('hex');
}


export function toDayKey(date) {
const d = new Date(date);
const y = d.getUTCFullYear();
const m = String(d.getUTCMonth() + 1).padStart(2, '0');
const day = String(d.getUTCDate()).padStart(2, '0');
return `${y}-${m}-${day}`;
}