import { useState } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import TopUpSuccess from "./TopUpSuccess";

function TopUp({ customer }) {
  const { user } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [topUpComplete, setTopUpComplete] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [newBalance, setNewBalance] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debug: Log user and customer data
  console.log("TopUp - Logged-in user:", user);
  console.log("TopUp - Customer:", customer);
  console.log("Customer user_id:", customer.user_id);

  const paymentMethods = [
    { label: "Cash", value: "Cash", icon: "💵" },
    { label: "Gpay", value: "Gpay", icon: "📱" },
    { label: "Mess Bill", value: "Mess bill", icon: "🛍" },
  ];

  const formatAmount = (value) => {
    console.log("formatAmount input:", value);
    if (!value) return "";
    const num = parseFloat(value);
    return isNaN(num) ? "" : num.toFixed(2);
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === "" || /^(\d*\.?\d{0,2})$/.test(value)) {
      setAmount(value);
    }
  };

  const fetchBalance = async (userId) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/user-balance/fetch-balance-by-id/${userId}`,
        { withCredentials: true }
      );
      console.log("Balance fetch response:", response.data);

      if (!response.data.success || !response.data.data) {
        throw new Error("Failed to fetch balance data");
      }

      // Extract balance and handle Decimal128
      const balance = response.data.data.balance;
      if (balance === undefined || balance === null) {
        throw new Error("Balance field is missing in response");
      }

      let balanceValue;
      if (typeof balance === "string") {
        balanceValue = balance;
      } else if (balance.$numberDecimal) {
        balanceValue = balance.$numberDecimal; // Extract the string value from Decimal128
      } else {
        balanceValue = balance.toString(); // Fallback for other cases
      }
      console.log("Extracted balance value:", balanceValue);

      return balanceValue;
    } catch (err) {
      console.error("Balance fetch error:", err);
      throw err;
    }
  };

  const handleTopUp = async () => {
    if (!amount || !selectedMethod) {
      setError("Please enter an amount and select a payment method.");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Amount must be a valid number greater than zero.");
      return;
    }

    if (!user || !user._id) {
      setError("You are not authenticated or user ID is missing. Please log in again.");
      return;
    }

    if (!customer.user_id) {
      setError("Customer ID is missing from customer data.");
      return;
    }

    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    if (!objectIdPattern.test(customer.user_id) || !objectIdPattern.test(user._id)) {
      setError("Invalid user or customer ID format. Please ensure the IDs are valid.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formattedAmount = parsedAmount.toFixed(2);

      const transferData = {
        sender_id: user._id,
        receiver_id: customer.user_id,
        amount: formattedAmount,
        transaction_type: "TopUp",
        payment_method: selectedMethod,
        remarks: remarks || undefined,
      };

      console.log("Sending transfer data:", transferData);
      console.log("API URL:", `${import.meta.env.VITE_BASE_URL}/transactions/transfer`);

      const transferResponse = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/transactions/transfer`,
        transferData,
        { withCredentials: true }
      );

      console.log("Transfer response:", transferResponse.data);

      if (!transferResponse.data.success) {
        throw new Error(transferResponse.data.message || "Failed to process top-up");
      }

      const transaction = transferResponse.data.transaction;
      if (!transaction.transaction_id) {
        throw new Error("Transaction ID missing in response");
      }

      // Fetch the receiver's updated balance
      const balanceValue = await fetchBalance(customer.user_id);

      setTransactionId(transaction.transaction_id);
      setNewBalance(balanceValue);
      setTopUpComplete(true);
    } catch (err) {
      console.error("Top-up error:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        fullError: err,
      });
      const errorMessage =
        err.response?.status === 400 && err.response?.data?.message.includes("Insufficient balance")
          ? "Sender has insufficient balance to complete the top-up."
          : err.response?.status === 400 && err.response?.data?.message.includes("Invalid data")
          ? "Invalid data provided. Please check your inputs."
          : err.response?.status === 400 && err.response?.data?.message.includes("limit")
          ? err.response.data.message
          : err.response?.status === 404
          ? "User or balance not found. Please check the server configuration."
          : err.response?.status === 500
          ? err.response?.data?.message || "Server error occurred. Please try again or contact support."
          : err.message || "An error occurred during top-up.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (topUpComplete) {
    const successData = {
      name: customer.name,
      amount: formatAmount(amount),
      method: paymentMethods.find((method) => method.value === selectedMethod)?.label || selectedMethod,
      newBalance: formatAmount(newBalance),
      transactionId: transactionId,
    };
    console.log("Success data passed to TopUpSuccess:", successData);

    return (
      <TopUpSuccess
        data={successData}
        onNewTopUp={() => {
          setTopUpComplete(false);
          setAmount("");
          setRemarks("");
          setSelectedMethod(null);
          setTransactionId("");
          setNewBalance("");
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-6">
        <div className="bg-[#040442] text-white text-lg font-semibold px-4 py-3 rounded-t-md">
          Top Up Card
        </div>
        <div className="bg-gray-100 p-4 rounded-md my-4">
          <div className="grid grid-cols-[160px_1fr] gap-4 mb-2">
            <span className="text-gray-700 font-medium">Customer:</span>
            <span className="text-gray-900 font-semibold">{customer.name}</span>
          </div>
          <div className="grid grid-cols-[160px_1fr] gap-4 mb-2">
            <span className="text-gray-700 font-medium">Phone:</span>
            <span className="text-gray-900 font-semibold">{customer.phone}</span>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount to Top Up (₹)</label>
          <input
            type="text"
            value={amount}
            onChange={handleAmountChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-200"
            placeholder="Enter amount (e.g., 200.00)"
            disabled={loading}
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
          <div className="grid grid-cols-3 gap-4">
            {paymentMethods.map((method) => (
              <button
                key={method.value}
                onClick={() => setSelectedMethod(method.value)}
                className={`flex flex-col items-center justify-center p-4 rounded-md hover:bg-gray-100 transition-all
                  ${selectedMethod === method.value ? "border-2 border-[#040442]" : "border border-gray-300"}
                  ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={loading}
              >
                <span className="text-xl" role="img" aria-label={method.label.toLowerCase()}>
                  {method.icon}
                </span>
                {method.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Remarks (optional)</label>
          <textarea
            rows="3"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-200"
            placeholder="Enter remarks (if any)"
            disabled={loading}
          />
        </div>
        {error && (
          <div className="mb-4 text-red-500 text-center">
            {error}
          </div>
        )}
        <div className="text-center">
          <button
            onClick={handleTopUp}
            className={`px-6 py-2 bg-[#070149] text-white rounded-lg hover:bg-[#3f3b6d] transition-all duration-200
              ${loading || !user ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={loading || !user}
          >
            {loading ? "Processing..." : "Complete Top Up"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TopUp;