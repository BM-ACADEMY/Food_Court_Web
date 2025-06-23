"use client";

import { useEffect, useRef, useState } from "react";
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
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QrCode, IndianRupee, ScanLine } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import TopUpSuccess from "./TopUpSuccess";

function TopUpOnlineUser() {
  const [scannedData, setScannedData] = useState(null);
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [topUpData, setTopUpData] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const qrRef = useRef(null);
  const html5QrCodeRef = useRef(null);

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

  const startScanner = async () => {
    setCameraError("");
    try {
      if (html5QrCodeRef.current) {
        await stopScanner();
      }

      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 300, height: 350 },
        },
        handleScanSuccess,
        error => console.warn("QR scan error:", error)
      );
    } catch (err) {
      console.error("Camera start failed:", err);
      setCameraError("Failed to access camera. Please check permissions.");
      html5QrCodeRef.current = null;
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.error("Stop failed:", err);
      } finally {
        html5QrCodeRef.current = null;
      }
    }
  };

  const handleScanSuccess = (decodedText) => {
    try {
      let data;

      // Parse JSON data
      try {
        data = JSON.parse(decodedText);
      } catch (jsonErr) {
        throw new Error("Invalid QR code format. Expected JSON data.");
      }

      // Validate required fields
      if (!data.customerId || !data.name || !data.phone || isNaN(data.currentBalance)) {
        alert("Invalid QR code data. Required fields: customerId, name, phone, currentBalance.");
        return;
      }

      setScannedData({
        customerId: data.customerId,
        name: data.name,
        phone: data.phone,
        currentBalance: parseFloat(data.currentBalance),
      });

      setScannerOpen(false);
      stopScanner();
    } catch (err) {
      console.error("QR parse error:", err);
      alert("Failed to parse QR code. Please scan a valid customer QR.");
    }
  };

  useEffect(() => {
    if (scannerOpen) {
      const delayStart = setTimeout(() => startScanner(), 300);
      return () => {
        clearTimeout(delayStart);
        stopScanner();
      };
    }
  }, [scannerOpen]);

  const handleKeyClick = key => {
    if (key === "C") {
      setAmount("");
    } else {
      setAmount(prev => prev + key);
    }
  };

  const handleTopUp = () => {
    const transactionId = "TXN" + Math.floor(1000000000 + Math.random() * 9000000000);
    const newBalance = scannedData.currentBalance + parseFloat(amount);

    setTopUpData({
      name: scannedData.name,
      amount,
      method: selectedMethod.charAt(0).toUpperCase() + selectedMethod.slice(1),
      newBalance,
      transactionId,
      customerId: scannedData.customerId,
      phone: scannedData.phone,
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
      <Card className="w-full max-w-xl shadow-2xl border rounded-2xl overflow-hidden m-0">
        <CardHeader className="bg-[#070149] p-4 rounded-t-2xl m-0">
          <CardTitle className="flex items-center gap-2 text-xl text-white m-0">
            <QrCode className="w-6 h-6 text-green-400" />
            Top Up - Online User
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 p-6 pt-0">
          <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full h-12 text-base">
                <QrCode className="w-5 h-5 mr-2 text-blue-600" />
                Scan QR Code
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Scan QR Code</DialogTitle>
              </DialogHeader>
              <div className="relative w-full h-64 bg-gray-100 border border-dashed border-[#070149] rounded-lg overflow-hidden">
                {!html5QrCodeRef.current && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ScanLine className="w-20 h-20 text-[#070149]" />
                  </div>
                )}
                <div id="qr-reader" ref={qrRef} className="w-full h-full" />
              </div>
              {cameraError && (
                <p className="text-red-500 text-sm mt-2">{cameraError}</p>
              )}
              <Button
                onClick={() => setScannerOpen(false)}
                className="mt-4 bg-[#070149] hover:bg-[#3f3b6d] text-white"
              >
                Close
              </Button>
            </DialogContent>
          </Dialog>

          {scannedData && (
            <div className="space-y-1 bg-gray-100 p-3 rounded-md text-sm">
              <p><strong>Customer ID:</strong> {scannedData.customerId}</p>
              <p><strong>Name:</strong> {scannedData.name}</p>
              <p><strong>Phone:</strong> {scannedData.phone}</p>
              <p><strong>Current Balance:</strong> ₹{scannedData.currentBalance}</p>
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