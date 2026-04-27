const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  
  // Basic Details
  description: { type: String }, 
  price: { type: String },       
  gender: { type: String, enum: ['Male', 'Female', 'Other'] }, 
  experience: { type: String },
  
  // Media & Links
  photo: { type: String }, // Base64 image string
  website: { type: String }, // Optional portfolio/restaurant link

  shopType: { 
    type: String, 
    // FIXED: Added 'Hostel' to this list so the database accepts it!
    enum: ['Restaurant', 'Medical', 'Grocery', 'Stationery', 'Services', 'Tutors', 'Hostel'], 
    required: true 
  },
  
  address: { type: String, required: true },
  phone: { type: String, required: true },
  isSosEnabled: { type: Boolean, default: false }, // Only for Medical Shops
  
  // Admin Approval System
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected'], 
    default: 'Pending' 
  },
  adminMessage: { type: String }, // Message from Admin upon review

  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [lng, lat]
  },

  // NEW: Store their Menu, Rooms, or Grocery Items!
  catalog: [{
    itemName: String,
    price: String,
    description: String,
    photo: String
  }]
  
}, { timestamps: true });

shopSchema.index({ location: '2dsphere' });
module.exports = mongoose.model('Shop', shopSchema);