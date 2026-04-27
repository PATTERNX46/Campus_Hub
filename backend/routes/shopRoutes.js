const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');

// Find nearby shops, or ALL approved shops if GPS coordinates are missing
router.get('/nearby', async (req, res) => {
  const { lat, lng, type } = req.query;

  try {
    // 1. Base Query: Must be Approved
    let query = { status: 'Approved' };

    // 2. Filter by Category (if they clicked 'Tutors', 'Restaurant', etc.)
    if (type && type !== 'All') {
      query.shopType = type;
    }

    // 3. Optional GPS Filtering
    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: 5000 // 5km radius
        }
      };
    }

    // Fetch from database
    const shops = await Shop.find(query);
    res.json(shops);

  } catch (error) {
    console.error("Backend Error:", error);
    res.status(500).json({ message: "Search failed", error: error.message });
  }
});

// GET a specific provider's listing status
router.get('/my-listing/:userId', async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.params.userId });
    if (!shop) return res.status(404).json({ message: "No listing found" });
    res.json(shop);
  } catch (error) {
    res.status(500).json({ message: "Error fetching listing", error: error.message });
  }
});

// POST: Register a NEW shop
router.post('/register', async (req, res) => {
  const { 
    ownerId, name, shopType, description, price, 
    gender, experience, address, phone, lat, lng, isSosEnabled,
    photo, website, catalog // <--- ADDED CATALOG HERE
  } = req.body;

  try {
    const newShop = await Shop.create({
      owner: ownerId, name, shopType, description, price,       
      gender, experience, address, phone, photo, website,     
      isSosEnabled: isSosEnabled || false,
      catalog: catalog || [], // <--- ADDED CATALOG HERE
      location: {
        type: 'Point',
        coordinates: [parseFloat(lng) || 88.3639, parseFloat(lat) || 22.5726] 
      }
    });
    res.status(201).json({ message: "Shop request submitted!", shop: newShop });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(400).json({ message: "Failed to register", error: error.message });
  }
});

// PUT route to UPDATE an existing shop!
router.put('/update/:shopId', async (req, res) => {
  const { 
    name, shopType, description, price, 
    gender, experience, address, phone, lat, lng, isSosEnabled,
    photo, website, catalog // <--- ADDED CATALOG HERE
  } = req.body;

  try {
    const updatedShop = await Shop.findByIdAndUpdate(
      req.params.shopId,
      {
        name, shopType, description, price,       
        gender, experience, address, phone, photo, website,     
        isSosEnabled: isSosEnabled || false,
        catalog: catalog || [], // <--- ADDED CATALOG HERE
        status: 'Pending', // Automatically sends them back to Admin for review!
        location: {
          type: 'Point',
          coordinates: [parseFloat(lng) || 88.3639, parseFloat(lat) || 22.5726] 
        }
      },
      { returnDocument: 'after' }
    );
    res.json({ message: "Profile updated and re-submitted for review!", shop: updatedShop });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(400).json({ message: "Failed to update", error: error.message });
  }
});

module.exports = router;