import jwt from 'jsonwebtoken';
import User from '../models/User.js';


const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';


export function signToken(user) {
return jwt.sign({ uid: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}


export async function authRequired(req, res, next) {
try {
const hdr = req.headers.authorization || '';
const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
if (!token) return res.status(401).json({ error: 'auth_required' });
const payload = jwt.verify(token, JWT_SECRET);
const user = await User.findById(payload.uid).lean();
if (!user) return res.status(401).json({ error: 'invalid_user' });
req.user = user;
next();
} catch (e) {
return res.status(401).json({ error: 'invalid_token' });
}
}


export async function authOptional(req, _res, next) {
try {
const hdr = req.headers.authorization || '';
const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
if (!token) return next();
const payload = jwt.verify(token, JWT_SECRET);
const user = await User.findById(payload.uid).lean();
if (user) req.user = user;
} catch {}
next();
}


export function requireAdmin(req, res, next) {
if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'admin_only' });
next();
}