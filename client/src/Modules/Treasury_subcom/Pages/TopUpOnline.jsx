import BackButton from "@/components/BackButton";
import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import TopUpSuccess from "./TopUpSuccess";

function TopUpOnline({ customer }) {
  const { user } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [topUpComplete, setTopUpComplete] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [newBalance, setNewBalance] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchCustomerHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/transactions/history/customer/${customer.customer_id}`,
        {
          params: { page: 1, limit: 5 },
          withCredentials: true,
        }
      );
      if (response.data.success) {
        setHistory(response.data.transactions || []);
      }
    } catch (err) {
      console.error("Failed to fetch history", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (customer?.customer_id) {
      fetchCustomerHistory();
    }
  }, [customer]);

  const formatReadableDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric', 
        hour: 'numeric', minute: 'numeric', hour12: true
      });
    } catch {
      return "N/A";
    }
  };

  const paymentMethods = [
    { label: "Cash", value: "Cash", icon: "💵" },
    { label: "Gpay", value: "Gpay", icon: "📱" },
    { label: "Mess Bill", value: "Mess bill", icon: "🛍" },
  ];

  const formatAmount = (value) => {
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
    console.log(userId, "fetch");
    
    const id = userId._id || userId; // handle both object and string
    const response = await axios.get(
      `${import.meta.env.VITE_BASE_URL}/user-balance/fetch-balance-by-id/${id}`,
      { withCredentials: true }
    );

    const balance = response.data.data?.balance;
    if (balance === undefined || balance === null) throw new Error("Failed to fetch balance");

    return typeof balance === "string"
      ? balance
      : balance.$numberDecimal || balance.toString();
  };

  const handleTopUp = async () => {
    if (!amount || !selectedMethod) return setError("Enter amount & select method.");
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) return setError("Invalid amount.");

    if (!user?._id || !customer.user_id) {
      return setError("User or customer ID is missing.");
    }

    setLoading(true);
    setError(null);

    try {
      const formattedAmount = parsedAmount.toFixed(2);
      const payload = {
        sender_id: user._id,
        receiver_id: customer.user_id,
        amount: formattedAmount,
        transaction_type: "TopUp",
        payment_method: selectedMethod,
        remarks: remarks || undefined,
      };

      const res = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/transactions/transfer`,
        payload,
        { withCredentials: true }
      );

      if (!res.data.success) throw new Error(res.data.message || "Top-up failed");

      const txnId = res.data.transaction?.transaction_id;
      if (!txnId) throw new Error("Transaction ID missing");

      const updatedBalance = await fetchBalance(customer.user_id);

      setTransactionId(txnId);
      setNewBalance(updatedBalance);
      setTopUpComplete(true);
      fetchCustomerHistory();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "An unexpected error occurred.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (topUpComplete) {
    return (
      <TopUpSuccess
        data={{
          name: customer.name,
          amount: formatAmount(amount),
          method: paymentMethods.find((m) => m.value === selectedMethod)?.label || selectedMethod,
          newBalance: formatAmount(newBalance),
          transactionId,
        }}
        customer={{
          ...customer,
          sender_id: user._id,
          receiver_id: customer.user_id,
        }}
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
    <div className="min-h-screen relative flex justify-center items-start bg-white px-4 py-8 overflow-y-auto pt-20">
      <BackButton />
      <div className="w-full max-w-lg flex flex-col gap-6">
        <div className="w-full border p-6 rounded-lg shadow-lg bg-gray-50">
          <h2 className="text-2xl font-bold mb-4 text-[#070149] text-center">Online Top-Up</h2>
        
        <div className="mb-4">
          <p className="text-sm text-gray-700"><strong>Customer:</strong> {customer.name}</p>
          <p className="text-sm text-gray-700"><strong>Phone:</strong> {customer.phone}</p>
        </div>

        <label className="block mb-1 text-sm text-gray-700">Amount (₹)</label>
        <input
          type="text"
          value={amount}
          onChange={handleAmountChange}
          className="w-full px-3 py-2 border rounded mb-4"
          placeholder="Enter amount"
          disabled={loading}
        />

        <label className="block mb-2 text-sm text-gray-700">Payment Method</label>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {paymentMethods.map((method) => (
            <button
              key={method.value}
              onClick={() => setSelectedMethod(method.value)}
              disabled={loading}
              className={`border rounded p-3 text-center transition ${
                selectedMethod === method.value
                  ? "bg-[#070149] text-white"
                  : "bg-white text-gray-700"
              }`}
            >
              <div className="text-xl">{method.icon}</div>
              <div>{method.label}</div>
            </button>
          ))}
        </div>

        <label className="block mb-1 text-sm text-gray-700">Remarks</label>
        <textarea
          rows="2"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          className="w-full px-3 py-2 border rounded mb-4"
          placeholder="Optional remarks"
          disabled={loading}
        />

        {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

        <button
          onClick={handleTopUp}
          className="w-full py-2 bg-[#070149] text-white rounded hover:bg-[#3f3b6d] transition"
          disabled={loading}
        >
          {loading ? "Processing..." : "Top Up Now"}
        </button>
      </div>

      {/* History Table */}
      <div className="w-full border p-6 rounded-lg shadow-lg bg-gray-50">
        <h3 className="text-xl font-bold mb-4 text-[#070149]">Recent Transactions</h3>
        {historyLoading ? (
          <p className="text-sm text-gray-500">Loading history...</p>
        ) : history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-200 text-gray-700">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Mode</th>
                </tr>
              </thead>
              <tbody>
                {history.map((txn, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="px-3 py-2 whitespace-nowrap">{formatReadableDate(txn.datetime)}</td>
                    <td className="px-3 py-2 font-medium" style={{ color: txn.amount > 0 ? 'green' : 'red' }}>
                      {txn.amount > 0 ? `+₹${txn.amount}` : `-₹${Math.abs(txn.amount)}`}
                    </td>
                    <td className="px-3 py-2">{txn.type}</td>
                    <td className="px-3 py-2">
                      {txn.payment_method ? (
                        <span className="px-2 py-1 bg-gray-100 border rounded-md text-xs">{txn.payment_method}</span>
                      ) : (
                        "N/A"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No recent transactions found.</p>
        )}
      </div>

      </div>
    </div>
  );
}

export default TopUpOnline;