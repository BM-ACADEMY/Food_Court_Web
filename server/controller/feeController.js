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
  try {
    const { sender_id, receiver_id } = req.body;

    // Validate inputs
    console.log('Received payload:', { sender_id, receiver_id });
    if (!sender_id || !receiver_id) {
      return res.status(400).json({ success: false, message: 'Sender ID and Receiver ID are required' });
    }

    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    if (!objectIdPattern.test(receiver_id) || !objectIdPattern.test(sender_id)) {
      return res.status(400).json({ success: false, message: 'Invalid sender_id or receiver_id format' });
    }

    console.log('Sender ID vs Receiver ID:', { senderId: sender_id, receiverId: receiver_id });

    // Validate sender_id and receiver_id exist
    const sender = await User.findById(sender_id);
    if (!sender) {
      console.warn(`Sender not found for sender_id: ${sender_id}`);
      return res.status(404).json({ success: false, message: 'Sender not found' });
    }
    const receiver = await User.findById(receiver_id);
    if (!receiver) {
      console.warn(`Receiver not found for receiver_id: ${receiver_id}`);
      return res.status(404).json({ success: false, message: 'Receiver not found' });
    }

    // Fetch customer data
    console.log('Fetching customer with receiver_id:', receiver_id);
    const customer = await Customer.findOne({ user_id: receiver_id }).populate('user_id', 'name email');

    if (!customer) {
      console.warn(`No customer found for receiver_id: ${receiver_id}`);
      return res.status(404).json({ success: false, message: `No customer found for receiver_id: ${receiver_id}` });
    }

    console.log('Customer fetch result:', {
      customerId: customer._id.toString(),
      userId: customer.user_id?._id?.toString(),
      name: customer.user_id?.name,
      registrationFeePaid: customer.registration_fee_paid,
    });

    // Validate receiver_id matches customer.user_id
    if (!customer.user_id || customer.user_id._id.toString() !== receiver_id) {
      console.warn(`Receiver ID ${receiver_id} does not match customer user_id ${customer.user_id?._id}`);
      return res.status(400).json({ success: false, message: 'Receiver ID does not match customer user_id' });
    }

    console.log('Receiver ID validation successful:', {
      receiverId: receiver_id,
      customerUserId: customer.user_id._id.toString(),
    });

    const customerMongoId = customer._id;
    const registrationFeePaid = customer.registration_fee_paid;

    // Check registration_fee_paid status
    if (registrationFeePaid) {
      console.log('Registration fee already paid for receiver_id:', receiver_id);
      return res.status(200).json({ success: true, message: 'Registration fee already paid' });
    }

    // Check balance
    console.log('Fetching balance for receiver_id:', receiver_id);
    const balanceResponse = await UserBalance.findOne({ user_id: receiver_id });

    if (!balanceResponse) {
      console.warn(`No balance found for receiver_id: ${receiver_id}`);
      return res.status(404).json({ success: false, message: 'Balance not found for receiver_id' });
    }

    console.log('Balance fetch result:', {
      userId: balanceResponse.user_id.toString(),
      balance: balanceResponse.balance.toString(),
    });

    const currentBalance = parseFloat(balanceResponse.balance.toString());
    if (isNaN(currentBalance)) {
      console.error('Invalid balance format:', balanceResponse.balance);
      return res.status(500).json({ success: false, message: 'Invalid balance format in database' });
    }

    if (currentBalance < 20) {
      console.warn(`Insufficient balance: ${currentBalance} for receiver_id: ${receiver_id}`);
      return res.status(400).json({ success: false, message: 'Insufficient balance to deduct registration fee' });
    }

    // Non-transactional mode
    console.log('Processing fee deduction in non-transactional mode for receiver_id:', receiver_id);

    // Deduct 20 from UserBalance
    console.log('Deducting balance for receiver_id:', receiver_id);
    const updatedBalance = await UserBalance.findOneAndUpdate(
      { user_id: receiver_id },
      { $inc: { balance: new mongoose.Types.Decimal128("-20.00") } },
      { new: true }
    );

    if (!updatedBalance) {
      console.error('Balance update failed for receiver_id:', receiver_id);
      throw new Error('Failed to deduct registration fee from balance');
    }

    console.log('Balance update result:', {
      userId: updatedBalance.user_id.toString(),
      newBalance: updatedBalance.balance.toString(),
    });

    // Initialize Counter
    await initializeCounter();

    // Create Fee record
    console.log('Creating fee record for receiver_id:', receiver_id);
    const fee = new Fee({
      user_id: new mongoose.Types.ObjectId(receiver_id),
      amount: new mongoose.Types.Decimal128("20.00"),
    });
    let savedFee;
    try {
      savedFee = await fee.save();
      console.log('Fee record saved:', {
        feeId: savedFee._id.toString(),
        userId: savedFee.user_id.toString(),
        amount: savedFee.amount.toString(),
      });
    } catch (err) {
      console.error('Fee save error:', {
        message: err.message,
        stack: err.stack,
        receiver_id,
      });
      throw new Error(`Failed to save fee record: ${err.message}`);
    }

    // Create Transaction record
    console.log('Creating transaction record');
    const transaction = new Transaction({
      sender_id: new mongoose.Types.ObjectId(sender_id),
      receiver_id: new mongoose.Types.ObjectId(receiver_id),
      amount: '20.00',
      transaction_type: 'Registration Fee',
      payment_method: 'Balance Deduction',
      remarks: 'Registration fee payment',
      status: 'Success',
    });
    let savedTransaction;
    try {
      savedTransaction = await transaction.save();
      console.log('Transaction saved:', {
        transactionId: savedTransaction.transaction_id || savedTransaction._id.toString(),
        senderId: savedTransaction.sender_id.toString(),
        receiverId: savedTransaction.receiver_id.toString(),
      });
    } catch (err) {
      console.error('Transaction save error:', {
        message: err.message,
        stack: err.stack,
        sender_id,
        receiver_id,
      });
      throw new Error(`Failed to save transaction record: ${err.message}`);
    }

    // Update Customer registration_fee_paid
    console.log('Updating customer registration_fee_paid for customer_id:', customerMongoId);
    const updatedCustomer = await Customer.findByIdAndUpdate(
      customerMongoId,
      { $set: { registration_fee_paid: true } },
      { new: true }
    );

    if (!updatedCustomer) {
      console.error('Customer update failed for customer_id:', customerMongoId);
      throw new Error('Failed to update customer registration fee status');
    }

    console.log('Customer update result:', {
      customerId: updatedCustomer._id.toString(),
      registrationFeePaid: updatedCustomer.registration_fee_paid,
    });

    console.log('Registration fee processed successfully for receiver_id:', receiver_id);
    res.status(200).json({
      success: true,
      message: 'Registration fee deducted and recorded successfully',
      balance: updatedBalance,
      fee: savedFee,
      transaction: savedTransaction,
    });
  } catch (err) {
    console.error('Fee deduction error:', {
      message: err.message,
      stack: err.stack,
      sender_id,
      receiver_id,
    });
    res.status(500).json({ success: false, message: `Error processing registration fee: ${err.message || 'Unknown error'}` });
  }
};