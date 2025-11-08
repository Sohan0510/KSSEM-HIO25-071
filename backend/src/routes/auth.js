import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { signToken } from '../middleware/auth.js';

const router = express.Router();

// Use separate secret and expiry for refresh tokens
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh';
const REFRESH_TOKENS = new Map(); // optional: replace with DB storage

// Helper: issue both tokens
function issueTokens(user) {
  const accessToken = signToken(user); // your existing short-lived token (e.g., 15m–1h)
  const refreshToken = jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  REFRESH_TOKENS.set(refreshToken, user._id.toString());
  return { accessToken, refreshToken };
}

// --- Register (Farmer/Admin) ---
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'name_email_password_required' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'email_in_use' });

    const u = new User({ name, email, role: role === 'admin' ? 'admin' : 'farmer' });
    await u.setPassword(password);
    await u.save();

    const { accessToken, refreshToken } = issueTokens(u);

    res.json({
      token: accessToken,
      refreshToken,
      user: { id: u._id, name: u.name, email: u.email, role: u.role },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'register_failed' });
  }
});

// --- Login ---
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const u = await User.findOne({ email });
    if (!u) return res.status(401).json({ error: 'invalid_credentials' });

    const ok = await u.comparePassword(password);
    if (!ok) return res.status(401).json({ error: 'invalid_credentials' });

    const { accessToken, refreshToken } = issueTokens(u);

    res.json({
      token: accessToken,
      refreshToken,
      user: { id: u._id, name: u.name, email: u.email, role: u.role },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'login_failed' });
  }
});

// --- Refresh Token ---
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ error: 'refresh_token_required' });

    const storedUserId = REFRESH_TOKENS.get(refreshToken);
    if (!storedUserId)
      return res.status(403).json({ error: 'invalid_refresh_token' });

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: 'user_not_found' });

    // Generate a fresh short-lived access token
    const newAccessToken = signToken(user);

    res.json({ token: newAccessToken });
  } catch (e) {
    console.error('refresh_failed', e);
    res.status(403).json({ error: 'invalid_or_expired_refresh_token' });
  }
});

// Optional: Logout (invalidate refresh token)
router.post('/logout', async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) REFRESH_TOKENS.delete(refreshToken);
  res.json({ ok: true });
});

export default router;
