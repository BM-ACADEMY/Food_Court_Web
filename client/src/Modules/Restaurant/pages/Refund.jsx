"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { QrCode, ScanLine, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
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
  DialogDescription,
} from "@/components/ui/dialog";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

export default function Refund() {
  const qrRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [customer, setCustomer] = useState({
    name: "",
    id: "",
    balance: 0,
    customer_id: "",
  });
  const [amount, setAmount] = useState("");
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
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
            qrbox: { width: 300, height: 350 },
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
            qrbox: { width: 300, height: 350 },
          },
          decodedText => handleScanSuccess(decodedText),
          error => console.warn("QR scan error:", error)
        );
        setScanning(true);
      }
    } catch (err) {
      console.error("Camera start failed:", err);
      setCameraError("Failed to access camera. Please check permissions or use manual QR input.");
      setShowResultDialog(true);
      setIsSuccess(false);
      setResultMessage("Failed to access camera. Please check permissions.");
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
      setShowScannerModal(false);
    } catch (err) {
      console.error("QR fetch error:", err.response?.data || err.message);
      setResultMessage("Failed to fetch customer details. Please scan a valid customer QR.");
      setIsSuccess(false);
      setShowResultDialog(true);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        await html5QrCodeRef.current.clear();
        setScanning(false);
      } catch (err) {
        console.error("Stop failed:", err);
      } finally {
        html5QrCodeRef.current = null;
      }
    }
  };

  const handleRefund = async () => {
    const refundAmount = parseFloat(amount);
    if (isNaN(refundAmount) || refundAmount <= 0) {
      setResultMessage("Please enter a valid amount greater than 0.");
      setIsSuccess(false);
      setShowResultDialog(true);
      return;
    }

    if (!customer.id || !user?._id) {
      setResultMessage("Invalid customer or user data. Please try scanning again.");
      setIsSuccess(false);
      setShowResultDialog(true);
      return;
    }

    try {
      console.log("Initiating refund:", {
        refundAmount,
        customerId: customer.id,
        restaurantId: user._id,
      });
      const formattedAmount = refundAmount.toFixed(2);
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/transactions/process-payment`,
        {
          sender_id: user._id, // Restaurant is the sender
          receiver_id: customer.id, // Customer is the receiver
          amount: formattedAmount,
          transaction_type: "Refund",
          payment_method: "Gpay",
          status: "Success", // Added to ensure compatibility with backend
          remarks: `Refund to ${customer.name} from restaurant`,
        },
        { withCredentials: true }
      );

      console.log("Refund response:", response.data);
      const newCustomerBalance = (customer.balance + refundAmount).toFixed(2);
      setCustomer(prev => ({
        ...prev,
        balance: parseFloat(newCustomerBalance),
      }));
      setAmount("");
      setResultMessage(
        `Successfully refunded ₹${formattedAmount} to ${customer.name}. ${response.data.message}`
      );
      setIsSuccess(true);
      setShowResultDialog(true);
    } catch (err) {
      console.error("Refund error:", err.response?.data || err.message);
      const errorMessage = err.response?.data?.message || "Failed to process refund. Please try again.";
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
          Refund QRCode Scanner
        </h2>

        <div className="flex flex-col items-center mb-6">
          <Button
            onClick={() => {
              setShowScannerModal(true);
              setTimeout(startScanner, 300);
            }}
            className="bg-white text-[#000066] border border-[#000066] hover:bg-[#000066] hover:text-white transition-colors duration-200 flex items-center justify-center gap-3
              w-64 px-6 py-3 text-base
              sm:w-72 sm:px-10 sm:py-5 sm:text-2xl
              md:w-80 md:px-12 md:py-6 md:text-3xl"
          >
            <QrCode className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
            Open Scanner
          </Button>
        </div>

        <div className="flex-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl md:text-2xl">Customer Details</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Scan or enter QR to fetch customer details and refund Amounts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
             <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6 sm:gap-8">
  <div className="flex-1">
    <p className="font-semibold text-lg sm:text-xl lg:text-2xl text-[#000052]">
      Name: {customer.name || "Not scanned"}
    </p>
    <p className="text-sm sm:text-base lg:text-lg text-gray-500">
      Customer ID: {customer.customer_id || "Not scanned"}
    </p>
  </div>

  <div className="text-left sm:text-right">
    <p className="text-sm sm:text-base lg:text-lg text-gray-500">Balance</p>
    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-700">
      ₹{customer.balance.toFixed(2)}
    </p>
  </div>
</div>


              <div className="space-y-1">
                <Label htmlFor="refundAmount" className="text-sm sm:text-base">
                  Refund Amount
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg pt-1">₹</span>
                  <Input
                    id="refundAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    className="h-8 px-3 text-sm sm:text-base"
                    placeholder="Amount to refund"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    disabled={!customer.id}
                  />
                </div>
                <Button
                  onClick={handleRefund}
                  disabled={!customer.id || !amount}
                  className="w-full mt-2 h-8 px-3 py-1 text-xs sm:text-sm bg-[#1a2f87] text-white"
                >
                  Refund Amounts
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Card>

      {/* Scanner Modal */}
      <Dialog open={showScannerModal} onOpenChange={setShowScannerModal}>
        <DialogContent className="max-w-[90vw] sm:max-w-lg md:max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl md:text-2xl">QR Scanner</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Scan the QR code to fetch customer details.
            </DialogDescription>
          </DialogHeader>
          <div className="w-full h-64 rounded-md overflow-hidden relative">
            {!scanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <ScanLine className="w-40 h-40 text-[#000052] opacity-90" />
              </div>
            )}
            <div
              id="qr-reader"
              ref={qrRef}
              className={`w-full h-full ${!scanning ? 'opacity-0' : 'opacity-100'}`}
            />
            {cameraError && (
              <p className="text-red-500 text-sm mt-2 text-center">{cameraError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                stopScanner();
                setShowScannerModal(false);
              }}
              className="bg-gray-500 hover:bg-gray-600 text-sm sm:text-base"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-[90vw] sm:max-w-lg md:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className={`flex items-center gap-3 ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
              {isSuccess ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <XCircle className="w-6 h-6" />
              )}
              <DialogTitle className="text-lg sm:text-xl md:text-2xl">
                {isSuccess ? "Refund Successful" : "Refund Failed"}
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
                  <p className="text-gray-700 font-medium text-sm sm:text-base">{resultMessage}</p>
                  <p className="text-sm sm:text-base text-gray-500 mt-2">
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
                  <p className="text-gray-700 font-medium text-sm sm:text-base">{resultMessage}</p>
                  <p className="text-sm sm:text-base text-gray-500 mt-2">
                    Please try again or contact support
                  </p>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowResultDialog(false)}
              className="bg-[#000052] hover:bg-[#000052cb] text-white text-sm sm:text-base"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}