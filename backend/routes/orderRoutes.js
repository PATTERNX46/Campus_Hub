const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');

// Initialize Razorpay with your Test Keys
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_dummy',
});

// 1. CREATE A PAYMENT ORDER (Fired when Student clicks "Pay/Book")
router.post('/create', async (req, res) => {
  try {
    const { studentId, providerId, shopId, serviceName, amount } = req.body;

    // Razorpay requires amount in PAISE (multiply by 100)
    const options = {
      amount: amount * 100, 
      currency: "INR",
      receipt: `receipt_${Date.now()}`
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Save "Pending" order in our database
    const newOrder = await Order.create({
      student: studentId,
      provider: providerId,
      shop: shopId,
      serviceName,
      amount,
      razorpayOrderId: razorpayOrder.id,
      status: 'Pending Payment'
    });

    res.json({ razorpayOrder, dbOrder: newOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create payment" });
  }
});

// 2. VERIFY PAYMENT (Fired automatically by Razorpay when test payment succeeds)
router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, dbOrderId } = req.body;

    // Verify the signature to ensure nobody hacked the payment
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'secret_dummy')
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      // Payment matches! Update the database!
      await Order.findByIdAndUpdate(dbOrderId, {
        status: 'Paid - Awaiting Service',
        razorpayPaymentId: razorpay_payment_id
      });
      return res.status(200).json({ message: "Payment verified successfully!" });
    } else {
      return res.status(400).json({ message: "Invalid payment signature!" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Verification failed" });
  }
});

// 3. GET ORDER BOOK FOR PROVIDERS
router.get('/provider/:providerId', async (req, res) => {
  try {
    const orders = await Order.find({ provider: req.params.providerId })
      .populate('student', 'name email phone') // Get student contact info
      .sort({ createdAt: -1 }); // Newest first
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching order book" });
  }
});

// 4. GET ORDER HISTORY FOR STUDENTS
router.get('/student/:studentId', async (req, res) => {
  try {
    const orders = await Order.find({ student: req.params.studentId })
      .populate('provider', 'name email phone') // Let the student see contact info for who they paid
      .sort({ createdAt: -1 }); // Newest first
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching student orders" });
  }
});

// 5. UPDATE ORDER APPROVAL STATUS (Accept/Reject)
router.put('/update-status', async (req, res) => {
  try {
    const { orderId, approvalStatus } = req.body;
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId, 
      { approvalStatus }, 
      { new: true }
    );
    res.json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update status" });
  }
});

module.exports = router;