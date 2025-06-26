import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from "@/context/AuthContext";

function TopUpSuccess({ data, onNewTopUp, customer }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleBackToHome = async () => {
    try {
      // Validate customer data and IDs
      if (!customer || !customer.receiver_id || !customer.sender_id) {
        throw new Error('Customer data, receiver_id, or sender_id is missing.');
      }
      if (!user || !user._id) {
        throw new Error('Authenticated user ID is missing.');
      }

      // Debug: Log sender_id and receiver_id
      console.log("Sender ID vs Receiver ID:", {
        senderId: customer.sender_id,
        receiverId: customer.receiver_id,
      });

      // Fetch customer data using receiver_id
      const customerResponse = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/customers/fetch-all-customer-details`,
        {
          params: { search: customer.receiver_id },
          withCredentials: true,
        }
      );

      console.log("Customer fetch response:", customerResponse.data);

      if (!customerResponse.data.success || !customerResponse.data.customers || customerResponse.data.customers.length === 0) {
        throw new Error(`No customer found for receiver_id: ${customer.receiver_id}`);
      }

      // Find customer matching receiver_id
      const customerData = customerResponse.data.customers.find(
        (c) => c.user_id._id === customer.receiver_id
      );

      if (!customerData) {
        throw new Error(`Customer with receiver_id ${customer.receiver_id} not found in response`);
      }

      // Validate receiver_id matches Customer.user_id
      if (customerData.user_id._id !== customer.receiver_id) {
        throw new Error(`Receiver ID ${customer.receiver_id} does not match customer user_id ${customerData.user_id._id}`);
      }

      console.log("Receiver ID validation successful:", {
        receiverId: customer.receiver_id,
        customerUserId: customerData.user_id._id,
      });

      const customerMongoId = customerData.customer_id; // Customer ID for update
      const registrationFeePaid = customerData.registration_fee_paid;

      // Check registration_fee_paid status
      if (registrationFeePaid) {
        console.log("Registration fee already paid, navigating to /home");
        navigate('/home');
        return;
      }

      // Check balance for receiver_id
      const balanceResponse = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/user-balance/fetch-balance-by-id/${customer.receiver_id}`,
        { withCredentials: true }
      );

      console.log("Balance fetch response:", balanceResponse.data);

      if (!balanceResponse.data.success) {
        throw new Error('Failed to fetch balance data');
      }

      const currentBalance = parseFloat(balanceResponse.data.data.balance.$numberDecimal || balanceResponse.data.data.balance);
      if (currentBalance < 20) {
        throw new Error('Insufficient balance to deduct registration fee');
      }

      // Perform fee deduction and updates
      try {
        // Deduct 20 from UserBalance
        const balanceUpdateResponse = await axios.post(
          `${import.meta.env.VITE_BASE_URL}/user-balance/create-or-update-balance`,
          {
            user_id: customer.receiver_id,
            balance: -20,
            transaction_type: 'Debit',
            payment_method: 'Registration Fee',
            remarks: 'Registration fee deduction',
          },
          { withCredentials: true }
        );

        if (!balanceUpdateResponse.data.success) {
          throw new Error('Failed to deduct registration fee from balance');
        }

        // Create Fee record
        const feeResponse = await axios.post(
          `${import.meta.env.VITE_BASE_URL}/fees/create-fee`,
          {
            user_id: customer.receiver_id,
            amount: 20,
          },
          { withCredentials: true }
        );

        if (!feeResponse.data.success) {
          throw new Error('Failed to create fee record');
        }

        // Create Transaction record
        const transactionResponse = await axios.post(
          `${import.meta.env.VITE_BASE_URL}/transactions/transfer`,
          {
            sender_id: customer.sender_id,
            receiver_id: customer.receiver_id,
            amount: '20.00',
            transaction_type: 'Registration Fee',
            payment_method: 'Balance Deduction',
            remarks: 'Registration fee payment',
          },
          { withCredentials: true }
        );

        if (!transactionResponse.data.success) {
          throw new Error('Failed to create transaction record');
        }

        // Update Customer registration_fee_paid
        const customerUpdateResponse = await axios.put(
          `${import.meta.env.VITE_BASE_URL}/customers/update-customer/${customerMongoId}`,
          {
            registration_fee_paid: true,
          },
          { withCredentials: true }
        );

        if (!customerUpdateResponse.data.success) {
          throw new Error('Failed to update customer registration fee status');
        }

        console.log("Registration fee processed successfully, navigating to /home");
        navigate('/home');
      } catch (err) {
        throw new Error(`Failed to process registration fee operations: ${err.message}`);
      }
    } catch (err) {
      console.error('Back to Home error:', err);
      alert(`Error processing registration fee: ${err.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md border rounded-2xl shadow-xl overflow-hidden">
        <CardHeader className="flex flex-col items-center justify-center py-6 space-y-2">
          <div className="text-green-600 text-5xl">✅</div>
          <CardTitle className="text-[#070149] text-xl font-bold text-center">
            Top Up Complete!
          </CardTitle>
          <p className="text-sm text-gray-500 text-center">
            The card has been topped up successfully:
          </p>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">Customer:</span>
              <span>{data.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Amount Added:</span>
              <span>₹{data.amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Payment Method:</span>
              <span>{data.method}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">New Balance:</span>
              <span>₹{data.newBalance}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Transaction ID:</span>
              <span>{data.transactionId}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-center p-4 space-x-4">
          <Button
            className="bg-[#070149] text-white text-base w-1/2 hover:opacity-90"
            onClick={onNewTopUp}
          >
            New Top Up
          </Button>
          <Button
            className="bg-[#070149] text-white text-base w-1/2 hover:opacity-90"
            onClick={handleBackToHome}
          >
            Back to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default TopUpSuccess;