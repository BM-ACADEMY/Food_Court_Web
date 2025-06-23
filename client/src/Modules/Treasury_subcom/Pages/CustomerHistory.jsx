import { useState, useEffect } from "react";

export default function CustomerHistory() {
  const [showDetails, setShowDetails] = useState(false);

  const handleQRClick = () => {
    setShowDetails(true); // Simulate QR scan
  };

  const [transactions, setTransactions] = useState([
    {
      type: "Topup",
      date: "03 Mar 2024 09:45 am",
      method: "Mess Bill",
      id: "TXN0000000010",
      amount: "+₹400",
      balance: "₹1200",
      color: "text-green-600",
      icon: "➕",
    },
    {
      type: "Refund",
      date: "02 Mar 2024 10:30 am",
      method: "Card • Refund for food quality issue",
      id: "TXN0000000009",
      amount: "+₹100",
      balance: "₹800",
      color: "text-green-600",
      icon: "↩️",
    },
    {
      type: "Purchase",
      date: "02 Mar 2024 10:00 am",
      method: "Card • Food stall purchase",
      id: "TXN0000000008",
      amount: "₹200",
      balance: "₹700",
      color: "text-red-500",
      icon: "🔒",
    },
    {
      type: "Refund",
      date: "01 Mar 2024 09:00 am",
      method: "Card • Food delay",
      id: "TXN0000000007",
      amount: "+₹200",
      balance: "₹900",
      color: "text-green-600",
      icon: "↩️",
    },
  ]);

  const handleClose = () => {
    setShowDetails(false);
    // Simulate data refresh by resetting transactions (e.g., fetch new data here)
    setTransactions([...transactions]); // This is a simple reset; replace with actual API call if needed
    window.history.back(); // Navigate back to previous page
  };

  const handleScroll = (direction) => {
    const container = document.querySelector(".space-y-4");
    if (container) {
      const scrollAmount = 200;
      container.scrollTop += direction === "up" ? -scrollAmount : scrollAmount;
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 px-4 py-10">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg">
        {/* Header */}
        <div className="bg-[#0B0742] text-white text-center py-4 rounded-t-2xl">
          <h2 className="text-xl font-semibold">Customer History</h2>
        </div>

        {/* Scan UI */}
        {!showDetails && (
          <div className="p-6 text-center">
            <button
              onClick={handleQRClick}
              className="bg-[#0B0742] text-white px-6 py-3 rounded-lg font-semibold text-sm"
            >
              📷 Scan Customer QR Code
            </button>
            <p className="mt-4 text-gray-500">Scan customer QR code to view their history</p>
            <p className="my-2 text-sm text-gray-500">Or search by ID/Phone</p>
            <div className="flex justify-center mt-3">
              <input
                type="text"
                placeholder="Enter ID or Phone Number"
                className="px-4 py-2 border border-gray-300 rounded-l-lg w-64"
              />
              <button className="bg-[#0B0742] px-4 text-white rounded-r-lg">🔍</button>
            </div>
          </div>
        )}

        {/* Customer Info */}
        {showDetails && (
          <div className="p-6 space-y-6">
            {/* Details */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Customer Details</h3>
              <button className="text-sm text-[#0B0742] hover:underline">⬇️ Export Data</button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <p><strong>Name:</strong> Jane Smith</p>
              <p><strong>Email:</strong> jane.smith@example.com</p>
              <p><strong>Phone:</strong> +91 87654 32109</p>
              <p><strong>Registration Date:</strong> 20 Jan 2024</p>
              <p><strong>Customer ID:</strong> C002</p>
              <p>
                <strong>Status:</strong>{" "}
                <span className="text-red-600 bg-red-100 px-2 py-0.5 rounded">Flagged</span>
              </p>
              <p><strong>Current Balance:</strong> ₹1200</p>
              <p><strong>Customer Type:</strong> Offline</p>
            </div>

            <div className="bg-red-100 text-red-700 px-4 py-3 rounded text-sm">
              <p><strong>Flag Reason:</strong><br />Multiple refund requests in short period</p>
            </div>

            {/* Transaction History */}
            <div className="pt-6 border-t">
              <div className="flex justify-between items-center mb-4">
                <div className="flex space-x-4">
                  <button className="border-b-2 border-blue-600 text-blue-600">All Transactions</button>
                  <button>Top Ups</button>
                  <button>Purchases</button>
                  <button>Refunds</button>
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Search transactions"
                    className="border px-3 py-1 text-sm rounded-md"
                  />
                  <select className="border px-3 py-1 text-sm rounded-md">
                    <option>All Time</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4 text-sm max-h-96 overflow-y-auto" style={{ scrollBehavior: "smooth" }}>
                {transactions.map((txn, index) => (
                  <div
                    key={index}
                    className="border p-4 rounded-md shadow-sm bg-gray-50"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2 font-medium">
                          <span>{txn.icon}</span>
                          <span>{txn.type}</span>
                        </div>
                        <p className="text-gray-600">{txn.date}</p>
                        <p className="text-gray-500">{txn.method}</p>
                        <p className="text-xs text-gray-400">ID: {txn.id}</p>
                      </div>
                      <div className="text-right">
                        <p className={`${txn.color} font-semibold`}>{txn.amount}</p>
                        <p className="text-gray-400 text-xs">Balance: {txn.balance}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Close Button */}
              <div className="text-center mt-4">
                <button
                  onClick={handleClose}
                  className="bg-[#0B0742] text-white px-6 py-2 rounded-lg font-semibold text-sm"
                >
                  Close
                </button>
              </div>

              {/* Scroll Buttons */}
              <div className="flex justify-center space-x-4 mt-2">
                <button
                  onClick={() => handleScroll("up")}
                  className="bg-[#0B0742] text-white px-3 py-1 rounded-lg"
                >
                  ↑
                </button>
                <button
                  onClick={() => handleScroll("down")}
                  className="bg-[#0B0742] text-white px-3 py-1 rounded-lg"
                >
                  ↓
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}