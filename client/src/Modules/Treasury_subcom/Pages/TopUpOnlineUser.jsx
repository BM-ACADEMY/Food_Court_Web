import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { QrCode, IndianRupee } from "lucide-react";
import TopUpSuccess from "./TopUpSuccess";

function TopUpOnlineUser() {
  const [scannedData, setScannedData] = useState(null);
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [topUpData, setTopUpData] = useState(null);

  const paymentMethods = [
    { label: "Cash", icon: "💵" },
    { label: "GPay", icon: "📱" },
    { label: "Mess Bill", icon: "🛍" },
  ];

  const transactions = [
    {
      name: "John Doe",
      date: "15/6/2025 01:29 pm",
      method: "GPay",
      amount: "+₹500",
      balance: "₹2000",
      editable: true,
    },
    {
      name: "John Doe",
      date: "15/6/2025 01:28 pm",
      method: "Mess Bill • My son will eat",
      amount: "+₹1000",
      balance: "₹1500",
      editable: false,
    },
  ];

  const handleScan = () => {
    const dataFromQR = {
      name: "John Doe",
      email: "john@example.com",
      phone: "+91 98765 43210",
      status: "Active",
      balance: "₹1500.00",
    };
    setScannedData(dataFromQR);
  };

  const handleKeyClick = (key) => {
    if (key === "C") {
      setAmount("");
    } else {
      setAmount((prev) => prev + key);
    }
  };

  const handleTopUp = () => {
    const transactionId =
      "TXN" + Math.floor(1000000000 + Math.random() * 9000000000);
    const newBalance = 2000;

    setTopUpData({
      name: scannedData.name,
      amount,
      method: selectedMethod.charAt(0).toUpperCase() + selectedMethod.slice(1),
      newBalance,
      transactionId,
    });

    setShowSuccess(true);
  };

  if (showSuccess) {
    return (
      <TopUpSuccess data={topUpData} onNewTopUp={() => setShowSuccess(false)} />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start py-10 px-4 m-0">
      {/* Top Up Card */}
      <Card className="w-full max-w-xl shadow-2xl border rounded-2xl overflow-hidden m-0">
        <CardHeader className="bg-[#070149] p-4 rounded-t-2xl m-0">
          <CardTitle className="flex items-center gap-2 text-xl text-white m-0">
            <QrCode className="w-6 h-6 text-green-400" />
            Top Up - Online User
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 p-6 pt-0">
          <Button
            variant="outline"
            className="w-full h-12 text-base"
            onClick={handleScan}
          >
            <QrCode className="w-5 h-5 mr-2 text-blue-600" />
            Scan QR Code
          </Button>

          {scannedData && (
            <div className="space-y-1 bg-gray-100 p-3 rounded-md text-sm">
              <p><strong>Name:</strong> {scannedData.name}</p>
              <p><strong>Email:</strong> {scannedData.email}</p>
              <p><strong>Phone:</strong> {scannedData.phone}</p>
              <p><strong>Status:</strong> {scannedData.status}</p>
              <p><strong>Current Balance:</strong> {scannedData.balance}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Enter Amount</label>
            <Input
              value={amount}
              readOnly
              className="text-xl font-bold text-center h-12"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "C"].map(
              (key) => (
                <Button
                  key={key}
                  onClick={() => handleKeyClick(key)}
                  variant="secondary"
                  className="h-12 text-base"
                >
                  {key}
                </Button>
              )
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
            {paymentMethods.map((method) => (
              <button
                key={method.label}
                onClick={() => setSelectedMethod(method.label.toLowerCase())}
                className={`h-12 text-base border rounded-md transition-all
                  ${
                    selectedMethod === method.label.toLowerCase()
                      ? "border-[#070149] text-[#070149] font-semibold"
                      : "border-gray-300 text-gray-600"
                  }
                `}
              >
                <span className="text-lg mr-1">{method.icon}</span>
                {method.label}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Remarks (optional)
            </label>
            <Textarea
              placeholder="Enter any remarks..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="h-24"
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-end px-6 pb-6">
          <Button
            disabled={!scannedData || !amount || !selectedMethod}
            className="h-12 text-base bg-[#070149] text-white hover:opacity-90"
            onClick={handleTopUp}
          >
            <IndianRupee className="w-5 h-5 mr-2 text-white" />
            Top Up
          </Button>
        </CardFooter>
      </Card>

      {/* Transaction History Table */}
      <div className="w-full max-w-xl mt-6 rounded-2xl shadow-lg overflow-hidden bg-white">
        <div className="bg-[#070149] text-white font-bold text-lg px-6 py-3">
          Transaction History
        </div>

        {transactions.map((txn, index) => (
          <div
            key={index}
            className="flex justify-between items-start px-6 py-4 border-b last:border-none"
          >
            <div>
              <div className="font-semibold text-base">{txn.name}</div>
              <div className="text-sm text-gray-500">{txn.date}</div>
              <div className="text-sm text-gray-500">{txn.method}</div>
            </div>
            <div className="text-right">
              <div className="text-green-600 font-semibold">{txn.amount}</div>
              <div className="text-sm text-gray-500">
                Balance: {txn.balance}
              </div>
              {txn.editable && (
                <button className="text-sm text-[#070149] font-semibold mt-1">
                  Edit
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TopUpOnlineUser;
