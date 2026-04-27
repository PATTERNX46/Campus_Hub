const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  
  serviceName: { type: String, required: true },
  amount: { type: Number, required: true },
  
  // Order Tracking (Payment Status)
  status: { 
    type: String, 
    enum: ['Pending Payment', 'Paid - Awaiting Service', 'Completed', 'Cancelled'], 
    default: 'Pending Payment' 
  },

  // NEW: Marketplace Approval Status 
  // Allows providers to Accept or Reject a request before or after payment
  approvalStatus: { 
    type: String, 
    enum: ['Pending Approval', 'Accepted', 'Rejected'], 
    default: 'Pending Approval' 
  },
  
  // Razorpay Transaction IDs
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);