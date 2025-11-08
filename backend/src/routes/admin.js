import express from 'express';
import User from '../models/User.js';
import { verifyFarmerWindowSelectivePurge, verifyAllFarmersWindowSelectivePurge } from '../services/integrity.js';


const router = express.Router();


// List farmers
router.get('/farmers', async (_req, res) => {
const farmers = await User.find({ role: 'farmer' }).select('_id name email').lean();
res.json({ farmers });
});


// Run verification+selective purge for one farmer
router.post('/verify/:farmerId', async (req, res) => {
  try {
    const { farmerId } = req.params;
    const days = parseInt(req.query.windowDays || process.env.VERIFY_WINDOW_DAYS || '20', 10);
    
    // First check if the farmer exists
    const farmer = await User.findById(farmerId);
    if (!farmer) {
      return res.status(404).json({ error: 'Farmer not found' });
    }
    if (farmer.role !== 'farmer') {
      return res.status(400).json({ error: 'Invalid user role' });
    }
    
    const report = await verifyFarmerWindowSelectivePurge({ farmerId, days });
    res.json({ success: true, report });
  } catch (err) {
    console.error('Farmer verification error:', err);
    res.status(500).json({ error: 'Verification failed', details: err.message });
  }
});

// Run for all farmers
router.post('/verify-all', async (req, res) => {
  try {
    const days = parseInt(req.query.windowDays || process.env.VERIFY_WINDOW_DAYS || '20', 10);
    console.log(`Running verify-all for ${days} days window...`);
    
    // First get all farmers
    const farmers = await User.find({ role: 'farmer' }).select('_id').lean();
    if (!farmers.length) {
      return res.json({ message: 'No farmers to verify' });
    }
    
    const out = await verifyAllFarmersWindowSelectivePurge({ days });
    console.log(`Verify-all completed for ${farmers.length} farmers`);
    
    res.json({ 
      success: true, 
      totalFarmers: farmers.length,
      result: out 
    });
  } catch (err) {
    console.error('Verify-all error:', err);
    res.status(500).json({ error: 'Verify-all failed', details: err.message });
  }
});


export default router;