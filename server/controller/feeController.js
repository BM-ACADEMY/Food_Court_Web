const mongoose = require('mongoose');
const Fee = require('../model/feeModel');
const Customer = require('../model/customerModel');
const UserBalance = require('../model/userBalanceModel');
const Transaction = require('../model/transactionModel');
const Counter = require('../model/counterModel');
const User = require('../model/userModel');

// Initialize Counter for transaction_id if it doesn't exist
async function initializeCounter() {
  try {
    const counter = await Counter.findOne({ _id: 'transaction_id' });
    if (!counter) {
      await Counter.create({ _id: 'transaction_id', seq: 0 });
      console.log('Initialized counter for transaction_id');
    }
  } catch (err) {
    console.error('Error initializing counter:', err.message, err.stack);
    throw err;
  }
}

// Create Fee Record
exports.createFee = async (req, res) => {
  try {
    const { user_id, amount } = req.body;

    if (!user_id || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid user_id or amount' });
    }

    // Validate user_id exists
    const user = await User.findById(user_id);
    if (!user) {
      console.warn(`User not found for user_id: ${user_id}`);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const fee = new Fee({
      user_id: new mongoose.Types.ObjectId(user_id),
      amount: new mongoose.Types.Decimal128(amount.toString()),
    });

    const savedFee = await fee.save();
    console.log('Fee created:', {
      feeId: savedFee._id.toString(),
      userId: savedFee.user_id.toString(),
      amount: savedFee.amount.toString(),
    });
    res.status(201).json({ success: true, data: savedFee });
  } catch (err) {
    console.error('Error creating fee:', err.message, err.stack);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get All Fees
exports.getAllFees = async (req, res) => {
  try {
    const fees = await Fee.find().populate('user_id', 'name email');
    res.status(200).json({ success: true, data: fees });
  } catch (err) {
    console.error('Error fetching fees:', err.message, err.stack);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get Fee by User ID
exports.getFeeByUserId = async (req, res) => {
  try {
    const fees = await Fee.find({ user_id: req.params.user_id }).populate('user_id', 'name email');
    if (!fees.length) {
      return res.status(404).json({ success: false, message: 'No fees found for this user' });
    }
    res.status(200).json({ success: true, data: fees });
  } catch (err) {
    console.error('Error fetching fee by user ID:', err.message, err.stack);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Fee Deduction Function
exports.feeDeduction = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB is not connected');
    }

    const { sender_id, receiver_id } = req.body;
    console.log('Received payload:', { sender_id, receiver_id });

    // Validate inputs
    if (!sender_id || !receiver_id) {
      return res.status(400).json({ success: false, message: 'Sender ID and Receiver ID are required' });
    }

    // Validate ObjectId format
    try {
      new mongoose.Types.ObjectId(sender_id);
      new mongoose.Types.ObjectId(receiver_id);
    } catch (err) {
      console.warn('Invalid ObjectId format:', { sender_id, receiver_id });
      return res.status(400).json({ success: false, message: 'Invalid sender_id or receiver_id format' });
    }

    // Validate sender and receiver
    const sender = await User.findById(sender_id).session(session);
    if (!sender) {
      return res.status(404).json({ success: false, message: 'Sender not found' });
    }
    const receiver = await User.findById(receiver_id).session(session);
    if (!receiver) {
      return res.status(404).json({ success: false, message: 'Receiver not found' });
    }

    // Fetch customer
    const customer = await Customer.findOne({ user_id: receiver_id })
      .populate('user_id', 'name email')
      .session(session);
    if (!customer) {
      return res.status(404).json({ success: false, message: `No customer found for receiver_id: ${receiver_id}` });
    }
    if (customer.user_id._id.toString() !== receiver_id) {
      return res.status(400).json({ success: false, message: 'Receiver ID does not match customer user_id' });
    }

    // Check registration fee status
    if (customer.registration_fee_paid) {
      return res.status(200).json({ success: true, message: 'Registration fee already paid' });
    }

    // Check balance
    const balanceResponse = await UserBalance.findOne({ user_id: receiver_id }).session(session);
    if (!balanceResponse) {
      return res.status(404).json({ success: false, message: 'Balance not found for receiver_id' });
    }

    const currentBalance = parseFloat(balanceResponse.balance.toString());
    if (isNaN(currentBalance) || currentBalance < 20) {
      return res.status(400).json({ success: false, message: 'Insufficient balance to deduct registration fee' });
    }

    // Check for existing fee
    const existingFee = await Fee.findOne({ user_id: receiver_id }).session(session).lean();
    if (existingFee) {
      console.warn(`Fee already exists for user_id: ${receiver_id}`, existingFee);
      return res.status(400).json({ success: false, message: 'Fee record already exists for this user' });
    }

    // Deduct balance
    const updatedBalance = await UserBalance.findOneAndUpdate(
      { user_id: receiver_id },
      { $inc: { balance: new mongoose.Types.Decimal128("-20.00") } },
      { new: true, session }
    );
    if (!updatedBalance) {
      throw new Error('Failed to deduct registration fee from balance');
    }

    // Create Fee record
    const fee = new Fee({
      user_id: new mongoose.Types.ObjectId(receiver_id),
      amount: new mongoose.Types.Decimal128("20.00"),
    });
    const savedFee = await fee.save({ session });
    console.log('Fee record saved:', {
      feeId: savedFee._id.toString(),
      userId: savedFee.user_id.toString(),
      amount: savedFee.amount.toString(),
    });

    // Create Transaction record
    const transaction = new Transaction({
      sender_id: new mongoose.Types.ObjectId(receiver_id),
      receiver_id: new mongoose.Types.ObjectId(sender_id),
      amount: '20.00',
      transaction_type: 'Registration Fee',
      payment_method: 'Balance Deduction',
      remarks: 'Registration fee payment',
      status: 'Success',
    });
    const savedTransaction = await transaction.save({ session });

    // Update Customer
    const updatedCustomer = await Customer.findByIdAndUpdate(
      customer._id,
      { $set: { registration_fee_paid: true } },
      { new: true, session }
    );
    if (!updatedCustomer) {
      throw new Error('Failed to update customer registration fee status');
    }

    // Commit transaction
    await session.commitTransaction();
    console.log('Registration fee processed successfully:', {
      receiverId: receiver_id,
      feeId: savedFee._id.toString(),
      transactionId: savedTransaction._id.toString(),
    });

    res.status(200).json({
      success: true,
      message: 'Registration fee deducted and recorded successfully',
      balance: updatedBalance,
      fee: savedFee,
      transaction: savedTransaction,
    });
  } catch (err) {
    await session.abortTransaction();
    console.error('Fee deduction error:', {
      message: err.message,
      stack: err.stack,
      sender_id: req.body.sender_id,
      receiver_id: req.body.receiver_id,
    });
    res.status(500).json({ success: false, message: `Error processing registration fee: ${err.message || 'Unknown error'}` });
  } finally {
    session.endSession();
  }
};