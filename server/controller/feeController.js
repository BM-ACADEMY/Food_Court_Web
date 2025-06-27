const mongoose = require('mongoose');
const Fee = require('../model/feeModel');
const Customer = require('../model/customerModel');
const UserBalance = require('../model/userBalanceModel');
const Transaction = require('../model/transactionModel');

// Create Fee Record
exports.createFee = async (req, res) => {
  try {
    const { user_id, amount } = req.body;

    if (!user_id || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid user_id or amount' });
    }

    const fee = new Fee({
      user_id,
      amount,
    });

    await fee.save();
    res.status(201).json({ success: true, data: fee });
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

    // Toggle for transaction vs. non-transactional mode
    const useTransactions = process.env.USE_MONGO_TRANSACTIONS !== 'false';

    if (useTransactions) {
      console.log('Using MongoDB transactions');
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Deduct 20 from UserBalance
        console.log('Deducting balance for receiver_id:', receiver_id);
        const updatedBalance = await UserBalance.findOneAndUpdate(
          { user_id: receiver_id },
          { $inc: { balance: -20 } },
          { new: true, session }
        );

        if (!updatedBalance) {
          throw new Error('Failed to deduct registration fee from balance');
        }

        console.log('Balance updated:', {
          userId: updatedBalance.user_id.toString(),
          newBalance: updatedBalance.balance.toString(),
        });

        // Create Fee record
        console.log('Creating fee record for receiver_id:', receiver_id);
        const fee = new Fee({
          user_id: receiver_id,
          amount: 20,
        });
        await fee.save({ session });

        console.log('Fee record created:', {
          feeId: fee._id.toString(),
          userId: fee.user_id.toString(),
          amount: fee.amount.toString(),
        });

        // Create Transaction record
        console.log('Creating transaction record');
        const transaction = new Transaction({
          sender_id,
          receiver_id,
          amount: '20.00',
          transaction_type: 'Registration Fee',
          payment_method: 'Balance Deduction',
          remarks: 'Registration fee payment',
          status: 'Success',
        });
        await transaction.save({ session });

        console.log('Transaction created:', {
          transactionId: transaction.transaction_id || transaction._id.toString(),
          senderId: transaction.sender_id.toString(),
          receiverId: transaction.receiver_id.toString(),
        });

        // Update Customer registration_fee_paid
        console.log('Updating customer registration_fee_paid for customer_id:', customerMongoId);
        const updatedCustomer = await Customer.findByIdAndUpdate(
          customerMongoId,
          { registration_fee_paid: true },
          { new: true, session }
        );

        if (!updatedCustomer) {
          throw new Error('Failed to update customer registration fee status');
        }

        console.log('Customer updated:', {
          customerId: updatedCustomer._id.toString(),
          registrationFeePaid: updatedCustomer.registration_fee_paid,
        });

        await session.commitTransaction();
        console.log('Registration fee processed successfully for receiver_id:', receiver_id);
        res.status(200).json({
          success: true,
          message: 'Registration fee deducted and recorded successfully',
          balance: updatedBalance,
          fee,
          transaction,
        });
      } catch (err) {
        await session.abortTransaction();
        console.error('Transaction error:', err.message, err.stack);
        throw new Error(`Failed to process registration fee operations: ${err.message}`);
      } finally {
        session.endSession();
      }
    } else {
      // Non-transactional mode for debugging
      console.log('Using non-transactional mode');
      console.log('Deducting balance for receiver_id:', receiver_id);
      const updatedBalance = await UserBalance.findOneAndUpdate(
        { user_id: receiver_id },
        { $inc: { balance: -20 } },
        { new: true }
      );

      if (!updatedBalance) {
        throw new Error('Failed to deduct registration fee from balance');
      }

      console.log('Balance updated:', {
        userId: updatedBalance.user_id.toString(),
        newBalance: updatedBalance.balance.toString(),
      });

      console.log('Creating fee record for receiver_id:', receiver_id);
      const fee = new Fee({
        user_id: receiver_id,
        amount: 20,
      });
      await fee.save();

      console.log('Fee record created:', {
        feeId: fee._id.toString(),
        userId: fee.user_id.toString(),
        amount: fee.amount.toString(),
      });

      console.log('Creating transaction record');
      const transaction = new Transaction({
        sender_id,
        receiver_id,
        amount: '20.00',
        transaction_type: 'Registration Fee',
        payment_method: 'Balance Deduction',
        remarks: 'Registration fee payment',
        status: 'Success',
      });
      await transaction.save();

      console.log('Transaction created:', {
        transactionId: transaction.transaction_id || transaction._id.toString(),
        senderId: transaction.sender_id.toString(),
        receiverId: transaction.receiver_id.toString(),
      });

      console.log('Updating customer registration_fee_paid for customer_id:', customerMongoId);
      const updatedCustomer = await Customer.findByIdAndUpdate(
        customerMongoId,
        { registration_fee_paid: true },
        { new: true }
      );

      if (!updatedCustomer) {
        throw new Error('Failed to update customer registration fee status');
      }

      console.log('Customer updated:', {
        customerId: updatedCustomer._id.toString(),
        registrationFeePaid: updatedCustomer.registration_fee_paid,
      });

      console.log('Registration fee processed successfully for receiver_id:', receiver_id);
      res.status(200).json({
        success: true,
        message: 'Registration fee deducted and recorded successfully',
        balance: updatedBalance,
        fee,
        transaction,
      });
    }
  } catch (err) {
    console.error('Fee deduction error:', err.message, err.stack);
    res.status(500).json({ success: false, message: `Error processing registration fee: ${err.message || 'Unknown error'}` });
  }
};