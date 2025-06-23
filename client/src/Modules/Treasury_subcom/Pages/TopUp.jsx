import { useState } from "react";

function TopUp({ customer }) {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [topUpComplete, setTopUpComplete] = useState(false);
  const [transactionId, setTransactionId] = useState("");

  const paymentMethods = [
    { label: "Cash", icon: "💵" },
    { label: "GPay", icon: "📱" },
    { label: "Mess Bill", icon: "🛍" },
  ];

  const handleTopUp = () => {
    // Basic validation
    if (!amount || !selectedMethod) {
      alert("Please enter amount and select a payment method.");
      return;
    }

    // Generate fake transaction ID
    const txnId = "TXN" + Math.floor(Math.random() * 1000000000);
    setTransactionId(txnId);

    // Set complete state
    setTopUpComplete(true);
  };

if (topUpComplete) {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-md overflow-hidden">

        {/* Success Header */}
        <div className="bg-[#040442] text-white text-lg font-semibold px-4 py-3 text-center">
          Top Up Successfully
        </div>

        {/* Content */}
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
              <span className="text-gray-900 font-semibold">₹{parseFloat(amount).toFixed(2)}</span>
            </div>
            <div className="grid grid-cols-[160px_1fr] gap-4 mb-2">
              <span className="text-gray-700 font-medium">Payment Method:</span>
              <span className="text-gray-900 font-semibold">{selectedMethod}</span>
            </div>
            <div className="grid grid-cols-[160px_1fr] gap-4 mb-2">
              <span className="text-gray-700 font-medium">New Balance:</span>
              <span className="text-gray-900 font-semibold">₹{parseFloat(amount).toFixed(2)}</span>
            </div>
            <div className="grid grid-cols-[160px_1fr] gap-4">
              <span className="text-gray-700 font-medium">Transaction ID:</span>
              <span className="text-gray-900 font-semibold">{transactionId}</span>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button className="bg-[#040442] text-white px-6 py-2 rounded-md hover:bg-[#2a2a72] transition">
              Register New User
            </button>
            <button
              onClick={() => setTopUpComplete(false)}
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
        
        {/* Header */}
        <div className="bg-[#040442] text-white text-lg font-semibold px-4 py-3 rounded-t-md">
          Top Up Card
        </div>

        {/* User Info */}
        <div className="bg-gray-100 p-4 rounded-md my-4">
          <div className="grid grid-cols-[160px_1fr] gap-4 mb-2">
            <span className="text-gray-700 font-medium">Customer:</span>
            <span className="text-gray-900 font-semibold">{customer.name}</span>
          </div>
          <div className="grid grid-cols-[160px_1fr] gap-4 mb-2">
            <span className="text-gray-700 font-medium">Phone:</span>
            <span className="text-gray-900 font-semibold">{customer.phone}</span>
          </div>
          <div className="grid grid-cols-[160px_1fr] gap-4">
            <span className="text-gray-700 font-medium">Current Balance:</span>
            <span className="text-gray-900 font-semibold">{customer.currentBalance}</span>
          </div>
        </div>

        {/* Amount Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount to Top Up (₹)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-200"
            placeholder="Enter amount"
          />
        </div>

        {/* Payment Methods */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
          <div className="grid grid-cols-3 gap-4">
            {paymentMethods.map((method) => (
              <button
                key={method.label}
                onClick={() => setSelectedMethod(method.label)}
                className={`flex flex-col items-center justify-center p-4 rounded-md hover:bg-gray-100 transition-all
                  ${selectedMethod === method.label
                    ? "border-2 border-[#040442]"
                    : "border border-gray-300"
                  }`}
              >
                <span className="text-xl" role="img" aria-label={method.label.toLowerCase()}>{method.icon}</span>
                {method.label}
              </button>
            ))}
          </div>
        </div>

        {/* Remarks Field */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Remarks (optional)</label>
          <textarea
            rows="3"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-200"
            placeholder="Enter remarks (if any)"
          ></textarea>
        </div>

        {/* Complete Button */}
        <div className="text-center">
          <button
            onClick={handleTopUp}
            className="px-6 py-2 bg-[#070149] text-white rounded-lg hover:bg-[#3f3b6d] transition-all duration-200"
          >
            Complete Top Up
          </button>
        </div>
      </div>
    </div>
  );
}

export default TopUp;
