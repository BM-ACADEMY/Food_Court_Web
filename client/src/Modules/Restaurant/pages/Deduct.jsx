"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { QrCode, ScanLine, CheckCircle2, XCircle } from "lucide-react";
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

export default function Deduct() {
  const qrRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const [scanning, setScanning] = useState(false);
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
  const [isLoading, setIsLoading] = useState(false);
  const { user, loading } = useAuth();
  const baseUrl = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    if (!loading && !user) {
      setResultMessage("Please log in to proceed.");
      setIsSuccess(false);
      setShowResultDialog(true);
    }
  }, [user, loading]);

  const startScanner = async () => {
    if (!user) {
      setResultMessage("Please log in to proceed.");
      setIsSuccess(false);
      setShowResultDialog(true);
      return;
    }

    const html5QrCode = new Html5Qrcode("qr-reader-modal");
    html5QrCodeRef.current = html5QrCode;

    try {
      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 30, qrbox: { width: 400, height: 500 } },
        async (decodedText) => {
          await handleScanSuccess(decodedText);
          stopScanner();
          setShowScannerModal(false);
        },
        (error) => {
          console.warn("QR scan error:", error);
        }
      );
      setScanning(true);
    } catch (err) {
      console.error("Camera start failed:", err);
      setResultMessage("Failed to start camera. Please ensure camera permissions are enabled and try again.");
      setIsSuccess(false);
      setShowResultDialog(true);
      setScanning(false);
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

  const handleScanSuccess = async (decodedText) => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${baseUrl}/customers/fetch-by-qr`,
        { params: { qr_code: decodedText }, withCredentials: true }
      );
      const { data } = response.data;

      const balanceResponse = await axios.get(
        `${baseUrl}/user-balance/fetch-balance-by-id/${data.user_id._id}`,
        { withCredentials: true }
      );
      const balance = parseFloat(balanceResponse.data.data.balance || "0.00");

      setCustomer({
        name: data.user_id.name,
        id: data.user_id._id,
        customer_id: data.customer_id,
        balance,
      });
    } catch (err) {
      console.error("QR fetch error:", err.response?.data || err.message);
      setResultMessage("Failed to fetch customer details. Please scan a valid customer QR or enter it manually.");
      setIsSuccess(false);
      setShowResultDialog(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeduct = async () => {
    const deductAmount = parseFloat(amount);
    if (isNaN(deductAmount) || deductAmount <= 0 || !Number.isFinite(deductAmount)) {
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

    if (!customer.id || !user?._id) {
      setResultMessage("Invalid customer or user data. Please try scanning again.");
      setIsSuccess(false);
      setShowResultDialog(true);
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    try {
      const formattedAmount = deductAmount.toFixed(2);
      const response = await axios.post(
        `${baseUrl}/transactions/process-payment`,
        {
          sender_id: customer.id,
          receiver_id: user._id,
          amount: formattedAmount,
          transaction_type: "Transfer",
          payment_method: "Gpay",
          status: "Success",
          remarks: `Payment from ${customer.name} to restaurant`,
        },
        { withCredentials: true }
      );

      setCustomer({
        name: "",
        id: "",
        balance: 0,
        customer_id: "",
      }); // Reset customer state after successful payment
      setAmount(""); // Reset input field after successful payment
      setResultMessage(
        `Successfully deducted ₹${formattedAmount} from ${customer.name}. ${response.data.message}`
      );
      setIsSuccess(true);
      setShowResultDialog(true);
    } catch (err) {
      console.error("Deduction error:", err.response?.data || err.message);
      const errorMessage = err.response?.data?.message || "Failed to process payment. Please try again.";
      setResultMessage(`Error: ${errorMessage}`);
      setIsSuccess(false);
      setShowResultDialog(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => stopScanner();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <Card className="mt-10 w-full max-w-6xl p-8 rounded-2xl shadow-md bg-white mx-auto">
        <h2 className="text-2xl font-bold text-[#000052] mb-6 text-left">
          Deduct QRCode Scanner
        </h2>

        <div className="flex flex-col items-center mb-6">
          <Button
            onClick={() => {
              setShowScannerModal(true);
              setTimeout(startScanner, 300);
            }}
            aria-label="Open QR code scanner"
            className="bg-white text-[#000066] border border-[#000066] hover:bg-[#000066] hover:text-white transition-colors duration-200 flex items-center justify-center gap-3
              w-64 px-6 py-3 text-base
              sm:w-72 sm:px-10 sm:py-5 sm:text-2xl
              md:w-80 md:px-12 md:py-6 md:text-3xl"
            disabled={isLoading || !user}
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
                Scan or enter QR to fetch customer details and deduct amounts.
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
                <Label htmlFor="deductAmount" className="text-sm sm:text-base">
                  Deduct Amount
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg pt-1">₹</span>
                  <Input
                    id="deductAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    className="h-8 px-3 text-sm sm:text-base"
                    placeholder="Amount to deduct"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    disabled={!customer.id || isLoading || !user}
                  />
                </div>
                <Button
                  onClick={handleDeduct}
                  disabled={!customer.id || !amount || isLoading || !user}
                  className="w-full mt-2 h-8 px-3 py-1 text-xs sm:text-sm bg-[#1a2f87] text-white"
                >
                  {isLoading ? "Processing..." : "Deduct Amount"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Card>

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
              id="qr-reader-modal"
              ref={qrRef}
              className={`w-full h-full ${!scanning ? "opacity-0" : "opacity-100"}`}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                stopScanner();
                setShowScannerModal(false);
              }}
              className="bg-gray-500 hover:bg-gray-600 text-sm sm:text-base"
              disabled={isLoading}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-[90vw] sm:max-w-lg md:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className={`flex items-center gap-3 ${isSuccess ? "text-green-600" : "text-red-600"}`}>
              {isSuccess ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <XCircle className="w-6 h-6" />
              )}
              <DialogTitle className="text-lg sm:text-xl md:text-2xl">
                {isSuccess ? "Payment Successful" : "Payment Failed"}
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm sm:text-base">
              {isSuccess ? "Transaction completed successfully." : "Please try again or contact support."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-colamericana items center gap-4 py-4">
            {isSuccess ? (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <div>
                  <p className="text-gray-700 font-medium text-sm sm:text-base">{resultMessage}</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-10 h-10 text-red-600" />
                </div>
                <div>
                  <p className="text-gray-700 font-medium text-sm sm:text-base">{resultMessage}</p>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowResultDialog(false)}
              className={`w-full ${isSuccess ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"} text-sm sm:text-base`}
              disabled={isLoading}
            >
              {isSuccess ? "Continue" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}