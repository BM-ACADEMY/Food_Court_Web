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

      const objectIdPattern = /^[0-9a-fA-F]{24}$/;
      if (!objectIdPattern.test(customer.receiver_id)) {
        console.warn('Invalid receiver_id format:', customer.receiver_id);
        navigate('/home');
        return;
      }

      // Debug: Log sender_id and receiver_id
      console.log("Sender ID vs Receiver ID:", {
        senderId: customer.sender_id,
        receiverId: customer.receiver_id,
      });

      // Call the fee deduction endpoint
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/fees/fee-deduction`,
        {
          sender_id: customer.sender_id,
          receiver_id: customer.receiver_id,
        },
        { withCredentials: true }
      );

      console.log('Fee deduction response:', response.data);

      if (response.data.success) {
        console.log('Registration fee processed successfully, navigating to /home');
        navigate('/');
      } else {
        throw new Error(response.data.message || 'Failed to process registration fee');
      }
    } catch (err) {
      console.error('Back to Home error:', err);
      alert(`Error processing registration fee: ${err.message || 'Unknown error'}`);
       // Fallback navigation
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