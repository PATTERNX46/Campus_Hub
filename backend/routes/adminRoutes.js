const express = require('express');
const Shop = require('../models/Shop');
const router = express.Router();

// GET all pending shop requests (For Admin Dashboard)
router.get('/pending-shops', async (req, res) => {
  try {
    // In a real app, you would add middleware here to ensure req.user.role === 'Admin'
    const pendingShops = await Shop.find({ status: 'Pending' }).populate('owner', 'name email');
    res.json(pendingShops);
  } catch (error) {
    res.status(500).json({ message: "Error fetching requests" });
  }
});

// PUT to approve a shop
router.put('/approve-shop/:shopId', async (req, res) => {
  try {
    const { message } = req.body; // Catch the custom message from the frontend popup
    
    const approvedShop = await Shop.findByIdAndUpdate(
      req.params.shopId, // FIXED: Matches the ':shopId' in the route URL
      { 
        status: 'Approved',
        adminMessage: message || 'Welcome to CampusHub! Your profile is live.' // Saves the message
      }, 
      { returnDocument: 'after' } // The modern Mongoose fix!
    );
    
    // FIXED: Changed 'shop' to 'approvedShop'
    res.json({ message: "Shop approved and is now live!", shop: approvedShop }); 
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error approving shop" });
  }
});

// NEW: PUT to reject a shop
router.put('/reject-shop/:shopId', async (req, res) => {
  try {
    const { message } = req.body; // Catch the rejection reason
    
    const rejectedShop = await Shop.findByIdAndUpdate(
      req.params.shopId, 
      { 
        status: 'Rejected',
        adminMessage: message || 'Your application was declined by the admin.'
      }, 
      { returnDocument: 'after' }
    );
    
    res.json({ message: "Shop application rejected.", shop: rejectedShop });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error rejecting shop" });
  }
});

module.exports = router;