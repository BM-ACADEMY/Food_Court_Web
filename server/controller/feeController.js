const mongoose = require('mongoose');
const Fee = require('../model/feeModel');
const Customer = require('../model/customerModel');
const UserBalance = require('../model/userBalanceModel');
const Transaction = require('../model/transactionModel');
const Counter = require('../model/counterModel');
const User = require('../model/userModel');
const Role =require('../model/roleModel')

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


exports.getAllFeesAdmin = async (req, res) => {
   try {
    const {
      page = 1,
      limit = 10,
      search = '',
      filter = 'all',
      sort = 'created_at',
      order = 'desc'
    } = req.query;

    // Build query
    const query = {};
    
    // Search by name or phone
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      const users = await User.find({
        $or: [
          { name: searchRegex },
          { phone_number: searchRegex }
        ]
      }).select('_id');
      
      query.user_id = { $in: users.map(user => user._id) };
    }

    // Date filter
    const now = new Date();
    // Adjust for IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
    const istNow = new Date(now.getTime() + istOffset);

    if (filter === 'today') {
      query.created_at = {
        $gte: new Date(istNow.setHours(0, 0, 0, 0)),
        $lte: new Date(istNow.setHours(23, 59, 59, 999))
      };
    } else if (filter === 'yesterday') {
      const yesterday = new Date(istNow);
      yesterday.setDate(istNow.getDate() - 1);
      query.created_at = {
        $gte: new Date(yesterday.setHours(0, 0, 0, 0)),
        $lte: new Date(yesterday.setHours(23, 59, 59, 999))
      };
    } else if (filter === 'week') {
      // Week starts on Monday and ends on Sunday
      const startOfWeek = new Date(istNow);
      const dayOfWeek = startOfWeek.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust for Sunday (0) to get to Monday
      startOfWeek.setDate(istNow.getDate() - daysToMonday);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      query.created_at = {
        $gte: startOfWeek,
        $lte: endOfWeek
      };
    }

    // Get total amount
    const totalAmountPipeline = [
      { $match: query },
      {
        $group: {
          _id: null,
          total: { $sum: { $toDouble: '$amount' } }
        }
      }
    ];
    const totalResult = await Fee.aggregate(totalAmountPipeline);
    const totalAmount = totalResult[0]?.total || 0;

    // Get fees with pagination and proper population
    const fees = await Fee.find(query)
      .populate({
        path: 'user_id',
        select: 'name phone_number is_flagged role_id',
        populate: {
          path: 'role_id',
          model: 'Role',
          select: 'name'
        }
      })
      .sort({ [sort]: order === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Fetch UserBalance for each user_id in fees
    const userIds = fees.map(fee => fee.user_id?._id).filter(id => id);
    const balances = await UserBalance.find({ user_id: { $in: userIds } }).select('user_id balance');

    // Map balances to fees
    const feesWithBalance = fees.map(fee => {
      const balanceRecord = balances.find(b => b.user_id.toString() === fee.user_id?._id?.toString());
      return {
        ...fee.toObject(),
        user_balance: balanceRecord ? parseFloat(balanceRecord.balance).toFixed(2) : '0.00'
      };
    });

    // Get total count for pagination
    const total = await Fee.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        fees: feesWithBalance,
        totalAmount,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (err) {
    console.error('Error fetching fees:', err.message, err.stack);
    res.status(500).json({ success: false, message: err.message });
  }
};