"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { QrCode, Play, Square, ScanLine, CheckCircle2, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import FoodStalls from "@/Modules/User/pages/UserDasboardpage/Foodstallsection";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const QrScanner = () => {
  const qrRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState("");
  const [parsedData, setParsedData] = useState({ name: "", store: "", restaurant_id: "" });
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(true);
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      setResultMessage("Please log in to make payments.");
      setIsSuccess(false);
      setShowResultDialog(true);
      navigate("/login");
    }
  }, [user, loading, navigate]);

  const isCustomer = user && user.role && user.role.role_id === "role-5";

  const startScanner = async () => {
    if (!isCustomer) {
      setResultMessage(user ? "Only customers can make payments." : "Please log in to make payments.");
      setIsSuccess(false);
      setShowResultDialog(true);
      return;
    }

    const html5QrCode = new Html5Qrcode("qr-reader-modal");
    html5QrCodeRef.current = html5QrCode;

    try {
      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 300, height: 250 } },
        async (decodedText) => {
          await validateQrCode(decodedText);
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
      setResultMessage("Failed to start camera.");
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
      }
    }
  };

  const validateQrCode = async (qrCode) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/restaurants/fetch-by-qr`,
        { params: { qr_code: qrCode }, withCredentials: true }
      );
      const restaurant = response.data.data;
      setResult(qrCode);
      setParsedData({
        name: restaurant.user_id.name,
        store: restaurant.restaurant_name,
        restaurant_id: restaurant.user_id._id,
      });
      setShowPaymentDialog(true);
    } catch (err) {
      setResultMessage(err.response?.data?.message || "Invalid QR code or restaurant not found.");
      setIsSuccess(false);
      setShowResultDialog(true);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!isCustomer || !user?._id) {
      setResultMessage(user ? "Only customers can make payments." : "Please log in to make payments.");
      setIsSuccess(false);
      setShowResultDialog(true);
      navigate("/login");
      return;
    }

    if (amount.trim() === "" || parseFloat(amount) <= 0) {
      setResultMessage("Please enter a valid amount greater than 0.");
      setIsSuccess(false);
      setShowResultDialog(true);
      return;
    }

    if (!parsedData.restaurant_id) {
      setResultMessage("Invalid restaurant selected.");
      setIsSuccess(false);
      setShowResultDialog(true);
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const paymentAmount = parseFloat(amount).toFixed(2);
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/transactions/process-payment`,
        {
          sender_id: user._id,
          receiver_id: parsedData.restaurant_id,
          amount: paymentAmount,
          transaction_type: "Transfer",
          payment_method: "Gpay",
          status: "Success",
          remarks: `Payment to ${parsedData.store}`,
        },
        { withCredentials: true }
      );

      setShowPaymentDialog(false);
      setResultMessage(
        `You have successfully sent ₹${paymentAmount} to ${parsedData.store}. ${response.data.message.includes("New customer balance") ? response.data.message : ""
        }`
      );
      setIsSuccess(true);
      setShowResultDialog(true);
      setAmount("");
    } catch (err) {
      setResultMessage(err.response?.data?.message || "Payment failed. Please try again.");
      setIsSuccess(false);
      setShowResultDialog(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualPayNow = ({ name, store, result, restaurant_id }) => {
    if (!isCustomer) {
      setResultMessage(user ? "Only customers can make payments." : "Please log in to make payments.");
      setIsSuccess(false);
      setShowResultDialog(true);
      navigate("/login");
      return;
    }

    setParsedData({ name, store, restaurant_id });
    setResult(result);
    setShowPaymentDialog(true);
  };

  useEffect(() => {
    return () => stopScanner();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <Card className="mt-10 w-full max-w-6xl p-8 rounded-2xl shadow-md bg-white mx-auto">
        <h2 className="text-2xl font-bold text-[#00004d] mb-6 text-left">QR Code Scanner</h2>

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
            disabled={!isCustomer}
          >
            <QrCode className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />

            Open Scanner
          </Button>
        </div>




        <div className="bg-white/50 backdrop-blur-lg border border-gray-200 rounded-xl p-6 shadow-sm max-h-[calc(50vh-100px)] overflow-y-auto">
          <div className="flex items-center gap-3 mb-4">
            <QrCode className="w-6 h-6 text-[#00004d]" />
            <h3 className="text-lg font-semibold text-[#00004d]">How to Pay</h3>
          </div>
          <ul className="space-y-4 text-gray-700 text-sm">
            {[
              "Scan the vendor's QR code or enter it manually.",
              "Confirm the amount and vendor details.",
              "Complete your payment.",
            ].map((text, index) => (
              <li key={index} className="flex gap-3 items-start">
                <span className="bg-[#000066] text-white min-w-6 min-h-6 rounded-full flex items-center justify-center text-xs font-bold mt-1">
                  {index + 1}
                </span>
                <span className="flex-1">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      {/* Scanner Modal */}
      <Dialog open={showScannerModal} onOpenChange={setShowScannerModal}>
        <DialogContent className="max-w-[90vw] sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl md:text-2xl">QR Scanner</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Scan the QR code to proceed with the payment.
            </DialogDescription>
          </DialogHeader>
          <div className="w-full h-64 rounded-md overflow-hidden relative">
            {!scanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <ScanLine className="w-40 h-40 text-[#00004d] opacity-90" />
              </div>
            )}
            <div id="qr-reader-modal" ref={qrRef} className={`w-full h-full ${!scanning ? "opacity-0" : "opacity-100"}`} />
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

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-[90vw] sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl md:text-2xl">Complete Payment</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Enter the payment amount and confirm details.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-[#f4f6ff] border text-sm sm:text-base text-gray-700 px-4 py-2 rounded mb-4 space-y-1">
            {parsedData.name && (
              <p>
                <span className="font-medium text-[#00004d]">Name:</span> {parsedData.name}
              </p>
            )}
            {parsedData.store && (
              <p>
                <span className="font-medium text-[#00004d]">Store:</span> {parsedData.store}
              </p>
            )}
            <p>
              <span className="font-medium text-[#00004d]">QR Code:</span>{" "}
              {result.length > 50 ? result.slice(0, 50) + "..." : result}
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <label className="text-sm sm:text-base text-gray-600">Amount (₹)</label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="amount"
              step="0.01"
              min="0.01"
              className="text-sm sm:text-base"
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowPaymentDialog(false)}
              className="bg-gray-500 hover:bg-gray-600 text-sm sm:text-base"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePaymentSubmit}
              className="bg-[#000066] hover:bg-[#000080] text-white text-sm sm:text-base"
              disabled={!isCustomer || !amount || isSubmitting}
            >
              Pay Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-[90vw] sm:max-w-lg md:max-w-md lg:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className={`flex items-center gap-3 ${isSuccess ? "text-green-600" : "text-red-600"}`}>
              {isSuccess ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
              <DialogTitle className="text-lg sm:text-xl md:text-2xl">
                {isSuccess ? "Payment Successful" : "Payment Failed"}
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm sm:text-base">
              {isSuccess ? "Your transaction was completed successfully." : "Please try again or contact support."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center text-center gap-4 py-4">
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
            >
              {isSuccess ? "Continue" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="mt-10 w-full max-w-6xl p-8 rounded-2xl shadow-md bg-white mx-auto">
        <FoodStalls handlePayNow={handleManualPayNow} />
      </Card>
    </>
  );
};

export default QrScanner;