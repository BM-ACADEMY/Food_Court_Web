"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { ScanLine, Play, Square, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

export default function Deduct() {
  const qrRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [manualQrCode, setManualQrCode] = useState("");
  const [customer, setCustomer] = useState({
    name: "",
    id: "",
    balance: 0,
    customer_id: "",
  });
  const [amount, setAmount] = useState("");
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(true);
  const { user } = useAuth();

  const getBackCamera = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === "videoinput");
      const backCamera = videoDevices.find(device =>
        device.label.toLowerCase().includes("back") ||
        device.label.toLowerCase().includes("rear")
      );
      return backCamera || videoDevices[0];
    } catch (err) {
      console.error("Camera enumeration failed:", err);
      return null;
    }
  };

  const startScanner = async () => {
    setCameraError("");
    try {
      if (html5QrCodeRef.current) {
        await stopScanner();
      }

      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      const backCamera = await getBackCamera();
      if (backCamera) {
        await html5QrCode.start(
          backCamera.deviceId,
          {
            fps: 10,
            qrbox: { width: 300, height: 150 },
          },
          decodedText => handleScanSuccess(decodedText),
          error => console.warn("QR scan error:", error)
        );
        setScanning(true);
      } else {
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 300, height: 150 },
          },
          decodedText => handleScanSuccess(decodedText),
          error => console.warn("QR scan error:", error)
        );
        setScanning(true);
      }
    } catch (err) {
      console.error("Camera start failed:", err);
      setCameraError("Failed to access camera. Please check permissions or use manual QR input.");
      html5QrCodeRef.current = null;
    }
  };

  const handleScanSuccess = async (decodedText) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/customers/fetch-by-qr?qr_code=${decodedText}`,
        { withCredentials: true }
      );
      const { data } = response.data;

      const balanceResponse = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/user-balance/fetch-balance-by-id/${data.user_id._id}`,
        { withCredentials: true }
      );
      const balance = parseFloat(balanceResponse.data.data.balance || "0.00");

      setCustomer({
        name: data.user_id.name,
        id: data.user_id._id,
        customer_id: data.customer_id,
        balance,
      });
      stopScanner();
    } catch (err) {
      console.error("QR fetch error:", err);
      setResultMessage("Failed to fetch customer details. Please scan a valid customer QR.");
      setIsSuccess(false);
      setShowResultDialog(true);
    }
  };

  const handleManualQrSubmit = async () => {
    if (!manualQrCode) {
      setResultMessage("Please enter a valid QR code.");
      setIsSuccess(false);
      setShowResultDialog(true);
      return;
    }
    await handleScanSuccess(manualQrCode);
    setManualQrCode("");
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        setScanning(false);
      } catch (err) {
        console.error("Stop failed:", err);
      } finally {
        html5QrCodeRef.current = null;
      }
    }
  };

  const handleDeduct = async () => {
    const deductAmount = parseFloat(amount);
    if (isNaN(deductAmount) || deductAmount <= 0) {
      setResultMessage("Please enter a valid amount greater than 0.");
      setIsSuccess(false);
      setShowResultDialog(true);
      return;
    }

    if (deductAmount > customer.balance) {
      setResultMessage(`Insufficient balance. Current balance: ₹${customer.balance.toFixed(2)}`);
      setIsSuccess(false);
      setShowResultDialog(true);
      return;
    }

    try {
      const formattedAmount = deductAmount.toFixed(2);
      const transactionPayload = {
        sender_id: customer.id,
        receiver_id: user._id,
        amount: formattedAmount,
        transaction_type: "Transfer",
        payment_method: "Gpay",
        status: "Success",
        remarks: `Payment from ${customer.name} to restaurant`,
      };

      // Create transaction
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/transactions/create-transaction`,
        transactionPayload,
        { withCredentials: true }
      );

      // Update customer balance
      const newCustomerBalance = (customer.balance - deductAmount).toFixed(2);
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/user-balance/create-or-update-balance`,
        {
          user_id: customer.id,
          balance: newCustomerBalance,
        },
        { withCredentials: true }
      );

      // Update restaurant balance
      const restaurantBalanceResponse = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/user-balance/fetch-balance-by-id/${user._id}`,
        { withCredentials: true }
      );
      const currentRestaurantBalance = parseFloat(restaurantBalanceResponse.data.data.balance || "0.00");
      const newRestaurantBalance = (currentRestaurantBalance + deductAmount).toFixed(2);
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/user-balance/create-or-update-balance`,
        {
          user_id: user._id,
          balance: newRestaurantBalance,
        },
        { withCredentials: true }
      );

      setCustomer(prev => ({
        ...prev,
        balance: parseFloat(newCustomerBalance),
      }));
      setAmount("");
      setResultMessage(`Payment successful! New customer balance: ₹${newCustomerBalance}`);
      setIsSuccess(true);
      setShowResultDialog(true);
    } catch (err) {
      console.error("Deduction error:", err);
      const errorMessage = err.response?.data?.message || "Failed to process payment. Please try again.";
      setResultMessage(`Error: ${errorMessage}`);
      setIsSuccess(false);
      setShowResultDialog(true);
    }
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        stopScanner();
      }
    };
  }, []);

  return (
    <>
      <Card className="mt-10 w-full max-w-6xl p-8 rounded-2xl shadow-md bg-white mx-auto">
        <h2 className="text-2xl font-bold text-[#000052] mb-6 text-left">
          Deduct QRCode Scanner
        </h2>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 flex flex-col items-center">
            <div className="relative w-full max-w-sm border-2 border-dashed border-[#000052] rounded-xl p-4 bg-[#f5f6fb] shadow-inner">
              <p className="absolute -top-4 left-4 text-xs font-medium bg-white px-2 py-0.5 rounded shadow text-[#000052]">
                Scan Live QR
              </p>

              <div className="w-full h-56 rounded-md overflow-hidden relative">
                {!scanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ScanLine className="w-40 h-40 text-[#000052] opacity-90" />
                  </div>
                )}
                <div
                  id="qr-reader"
                  ref={qrRef}
                  className="w-full h-full bg-gray-100"
                />
              </div>
              {cameraError && (
                <p className="text-red-500 text-sm mt-2 text-center">{cameraError}</p>
              )}
            </div>

            <div className="mt-4 w-full max-w-sm">
              <Label htmlFor="manualQrCode" className="text-sm">
                Enter QR Code Manually
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="manualQrCode"
                  type="text"
                  className="h-8 px-3 text-sm"
                  placeholder="Enter customer QR code"
                  value={manualQrCode}
                  onChange={e => setManualQrCode(e.target.value)}
                />
                <Button
                  onClick={handleManualQrSubmit}
                  className="bg-[#000052] hover:bg-[#000052cb] text-white text-sm"
                >
                  Submit QR
                </Button>
              </div>
            </div>

            <div className="mt-6 w-full flex justify-center">
              {!scanning ? (
                <Button
                  onClick={startScanner}
                  className="bg-[#000052] hover:bg-[#000052cb] text-white text-sm flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Start Scanner
                </Button>
              ) : (
                <Button
                  onClick={stopScanner}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm flex items-center gap-2"
                >
                  <Square className="w-4 h-4" />
                  Stop Scanner
                </Button>
              )}
            </div>
          </div>

          <div className="flex-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Customer Details</CardTitle>
                <CardDescription>
                  Scan or enter QR to fetch customer details and deduct points.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="mb-6 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-lg">
                      Name: {customer.name || "Not scanned"}
                    </p>
                    <p className="text-sm text-gray-500">
                      Customer ID: {customer.customer_id || "Not scanned"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Balance</p>
                    <p className="text-xl font-bold text-blue-700">
                      ₹{customer.balance.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="deductAmount" className="text-sm">
                    Deduct Points
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-base pt-1">₹</span>
                    <Input
                      id="deductAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      className="h-8 px-3 text-sm"
                      placeholder="Amount to deduct"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      disabled={!customer.id}
                    />
                  </div>
                  <Button
                    onClick={handleDeduct}
                    disabled={!customer.id || !amount}
                    className="w-full mt-2 h-8 px-3 py-1 text-xs bg-[#1a2f87] text-white"
                  >
                    Deduct Points
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Card>

      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className={`flex items-center gap-3 ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
              {isSuccess ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <XCircle className="w-6 h-6" />
              )}
              <DialogTitle className="text-lg">
                {isSuccess ? "Payment Successful" : "Payment Failed"}
              </DialogTitle>
            </div>
          </DialogHeader>
          <div className="flex flex-col items-center text-center gap-4 py-4">
            {isSuccess ? (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <div>
                  <p className="text-gray-700 font-medium">{resultMessage}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Transaction completed successfully
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-10 h-10 text-red-600" />
                </div>
                <div>
                  <p className="text-gray-700 font-medium">{resultMessage}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Please try again or contact support
                  </p>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowResultDialog(false)}
              className={`w-full ${isSuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {isSuccess ? 'Continue' : 'Try Again'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}