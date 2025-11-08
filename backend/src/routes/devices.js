import express from 'express';
import Device from '../models/Device.js';

const router = express.Router();

// List devices for a farmer. If ?farmerId= provided (admin use), honor it; otherwise use authenticated user
router.get('/', async (req, res) => {
  try {
    const farmerId = req.query.farmerId || req.user?._id;
    if (!farmerId) return res.status(400).json({ error: 'farmerId_required' });
    const devices = await Device.find({ farmerId }).lean();
    res.json({ devices });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'devices_list_failed' });
  }
});

// Create a device
router.post('/', async (req, res) => {
  try {
    const { deviceId, farmerId } = req.body;
    const owner = farmerId || req.user?._id;
    if (!deviceId || !owner) return res.status(400).json({ error: 'deviceId_and_farmerId_required' });
    const exists = await Device.findOne({ deviceId }).lean();
    if (exists) return res.status(409).json({ error: 'device_already_exists' });
    const doc = await Device.create({ deviceId, farmerId: owner });
    res.json({ ok: true, device: doc });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'device_create_failed' });
  }
});

// Delete a device by deviceId or by _id
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const farmerId = req.user?._id;
    if (!farmerId) return res.status(401).json({ error: 'auth_required' });

    // Try to delete by deviceId first
    let doc = await Device.findOneAndDelete({ deviceId: id, farmerId });
    if (!doc) {
      // Try by _id
      doc = await Device.findOneAndDelete({ _id: id, farmerId });
    }
    if (!doc) return res.status(404).json({ error: 'device_not_found' });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'device_delete_failed' });
  }
});

export default router;
