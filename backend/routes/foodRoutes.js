const express = require('express');
const router = express.Router();
const FoodItem = require('../models/FoodItem');

// GET /api/food/nearby?lat=...&lng=...&type=...
router.get('/nearby', async (req, res) => {
  const { lat, lng, type } = req.query; // type can be 'Ghar Ka Khana' or 'Restaurant'

  try {
    // 1. Start with an empty query object
    let query = {};
    
    // 2. Filter by category if provided
    if (type && type !== 'All') {
      query.category = type;
    }

    // 3. ONLY add the $near location filter if lat and lng are valid numbers!
    if (lat && lng && lat !== "" && lng !== "") {
      query.location = {
        $near: {
          $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: 5000 // 5km ke radius mein search karega
        }
      };
    }

    // 4. Fetch from database using the safe query
    const nearbyFood = await FoodItem.find(query).populate('provider', 'name phone');

    res.json(nearbyFood);
  } catch (error) {
    console.error("Food Route Error:", error);
    res.status(500).json({ message: "Search fail ho gaya", error: error.message });
  }
});

// Provider ke liye item add karne ka route
router.post('/add', async (req, res) => {
  const { provider, name, price, category, lat, lng } = req.body;
  try {
    const newItem = await FoodItem.create({
      provider, name, price, category,
      location: { type: 'Point', coordinates: [lng, lat] }
    });
    res.status(201).json(newItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;