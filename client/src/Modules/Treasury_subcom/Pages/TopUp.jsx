import { useState } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

function TopUp({ customer }) {
  const { user } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [topUpComplete, setTopUpComplete] = useState(false);
  const [transactionId, setTransactionId] = useState("");
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

    // Validate customer.user_id format (ObjectId check)
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    if (!objectIdPattern.test(customer.user_id)) {
      setError("Invalid customer ID format. Please ensure the ID is valid.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formattedAmount = parsedAmount.toFixed(2);

      // Step: Update balance (creates transaction internally)
      const balanceData = {
        user_id: customer.user_id,
        balance: formattedAmount,
        transaction_type: "Credit",
        payment_method: selectedMethod,
        remarks: remarks || undefined,
      };

      console.log("Sending balance data:", balanceData);
      console.log("API URL:", `${import.meta.env.VITE_BASE_URL}/user-balance/create-or-update-balance`);

      const balanceResponse = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/user-balance/create-or-update-balance`,
        balanceData,
        { withCredentials: true }
      );

      console.log("Balance response:", balanceResponse.data);

      if (!balanceResponse.data.success) {
        throw new Error(balanceResponse.data.message || "Failed to update balance");
      }

      // Use transaction ID from balance response
      setTransactionId(balanceResponse.data.transaction._id);
      setTopUpComplete(true);
    } catch (err) {
      console.error("Top-up error:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        fullError: err,
      });
      const errorMessage =
        err.response?.status === 400 && err.response?.data?.message.includes("creation limit")
          ? err.response.data.message
          : err.response?.status === 400 && err.response?.data?.message.includes("not a valid enum value")
          ? "Invalid payment method selected. Please try again."
          : err.response?.status === 400 && err.response?.data?.message.includes("duplicate key")
          ? "Duplicate transaction error. Please try again or contact support."
          : err.response?.status === 404
          ? "API endpoint not found. Please check the server configuration."
          : err.response?.status === 500
          ? err.response?.data?.message || "Server error occurred. Please try again or contact support."
          : err.response?.data?.message || "An error occurred during top-up.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (topUpComplete) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-[#040442] text-white text-lg font-semibold px-4 py-3 text-center">
            Top Up Successful
          </div>
          <div className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="text-green-500 text-6xl">✅</div>
            </div>
            <h2 className="text-xl font-bold mb-2">Top Up Complete!</h2>
            <p className="text-gray-600 mb-6">The card has been topped up successfully:</p>
            <div className="bg-gray-100 p-4 rounded-md text-left mb-6">
              <div className="grid grid-cols-[160px_1fr] gap-4 mb-2">
                <span className="text-gray-700 font-medium">Customer:</span>
                <span className="text-gray-900 font-semibold">{customer.name}</span>
              </div>
              <div className="grid grid-cols-[160px_1fr] gap-4 mb-2">
                <span className="text-gray-700 font-medium">Amount Added:</span>
                <span className="text-gray-900 font-semibold">₹{formatAmount(amount)}</span>
              </div>
              <div className="grid grid-cols-[160px_1fr] gap-4 mb-2">
                <span className="text-gray-700 font-medium">Payment Method:</span>
                <span className="text-gray-900 font-semibold">
                  {paymentMethods.find((method) => method.value === selectedMethod)?.label}
                </span>
              </div>
              <div className="grid grid-cols-[160px_1fr] gap-4 mb-2">
                <span className="text-gray-700 font-medium">New Balance:</span>
                <span className="text-gray-900 font-semibold">₹{formatAmount(amount)}</span>
              </div>
              <div className="grid grid-cols-[160px_1fr] gap-4">
                <span className="text-gray-700 font-medium">Transaction ID:</span>
                <span className="text-gray-900 font-semibold">{transactionId}</span>
              </div>
            </div>
            <div className="flex justify-center gap-4">
              <button
                className="bg-[#040442] text-white px-6 py-2 rounded-md hover:bg-[#2a2a72] transition"
                onClick={() => window.location.href = "/treasury/register-customer"}
              >
                Register New User
              </button>
              <button
                onClick={() => {
                  setTopUpComplete(false);
                  setAmount("");
                  setRemarks("");
                  setSelectedMethod(null);
                  setTransactionId("");
                }}
                className="border border-[#040442] text-[#040442] px-6 py-2 rounded-md hover:bg-gray-200 transition"
              >
                Top Up Another Card
              </button>
            </div>
          </div>
        </div>
      </div>
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