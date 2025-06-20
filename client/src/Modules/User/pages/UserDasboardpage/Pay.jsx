"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { QrCode, Play, Square, ScanLine } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import FoodStalls from "@/Modules/User/pages/UserDasboardpage/Foodstallsection";

const QrScanner = () => {
  const qrRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState("");
  const [parsedData, setParsedData] = useState({ name: "", store: "" });
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [amount, setAmount] = useState("");

  const startScanner = async () => {
    const html5QrCode = new Html5Qrcode("qr-reader");
    html5QrCodeRef.current = html5QrCode;

    try {
      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 300, height: 150 } },
        (decodedText) => {
          setResult(decodedText);
          try {
            const data = JSON.parse(decodedText);
            setParsedData({
              name: data.name || "",
              store: data.store || "",
            });
          } catch {
            setParsedData({ name: "", store: "" });
          }
          setShowPaymentDialog(true);
          stopScanner();
        },
        (error) => {
          console.warn("QR scan error:", error);
        }
      );
      setScanning(true);
    } catch (err) {
      console.error("Camera start failed:", err);
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

  const handlePaymentSubmit = () => {
    if (amount.trim() !== "") {
      setShowPaymentDialog(false);
      setShowSuccessDialog(true);
    }
  };

  const handleManualPayNow = ({ name, store, result }) => {
    setParsedData({ name, store });
    setResult(result);
    setShowPaymentDialog(true);
  };

  useEffect(() => {
    return () => stopScanner();
  }, []);

  return (
    <>
      <Card className="mt-10 w-full max-w-6xl p-8 rounded-2xl shadow-md bg-white mx-auto">
        <h2 className="text-2xl font-bold text-[#00004d] mb-6 text-left">
          QR Code Scanner
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
                    <ScanLine className="w-40 h-40 text-[#00004d] opacity-90" />
                  </div>
                )}
                <div id="qr-reader" ref={qrRef} className="w-full h-full" />
              </div>
            </div>

            <div className="mt-6 w-full flex justify-center">
              {!scanning ? (
                <Button
                  onClick={startScanner}
                  className="bg-[#000066] hover:bg-[#000080] text-white text-sm flex items-center gap-2"
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

          <div className="flex-1 bg-white/50 backdrop-blur-lg border border-gray-200 rounded-xl p-6 shadow-sm max-h-[calc(50vh-100px)] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <QrCode className="w-6 h-6 text-[#00004d]" />
              <h3 className="text-lg font-semibold text-[#00004d]">
                Scan QR to Pay
              </h3>
            </div>

            <p className="text-sm text-gray-600 mb-4">How to Pay</p>
            <ul className="space-y-3 text-gray-700 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-[#000066] font-semibold">•</span>
                Ask the vendor to show their payment QR code and scan it using
                the scanner.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#000066] font-semibold">•</span>
                Confirm the amount and vendor details.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#000066] font-semibold">•</span>
                Complete your payment.
              </li>
            </ul>
          </div>
        </div>

        {/* Payment Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Complete Payment</DialogTitle>
            </DialogHeader>

            <div className="bg-[#f4f6ff] border text-sm text-gray-700 px-4 py-2 rounded mb-4 space-y-1">
              {parsedData.name && (
                <p>
                  <span className="font-medium text-[#00004d]">Name:</span>{" "}
                  {parsedData.name}
                </p>
              )}
              {parsedData.store && (
                <p>
                  <span className="font-medium text-[#00004d]">Store:</span>{" "}
                  {parsedData.store}
                </p>
              )}
              <p>
                <span className="font-medium text-[#00004d]">QR Code:</span>{" "}
                {result.length > 50 ? result.slice(0, 50) + "..." : result}
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <label className="text-sm text-gray-600">Amount (₹)</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="₹ Enter amount"
              />
            </div>

            <DialogFooter className="mt-4 flex justify-end">
              <Button
                onClick={handlePaymentSubmit}
                className="bg-[#000066] text-white"
              >
                Pay Now
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Payment Successful</DialogTitle>
            </DialogHeader>

            <div className="bg-[#e6ffef] border text-sm text-green-700 px-4 py-2 rounded mb-3 space-y-1">
              {parsedData.name && (
                <p>
                  <span className="font-medium text-green-900">Name:</span>{" "}
                  {parsedData.name}
                </p>
              )}
              {parsedData.store && (
                <p>
                  <span className="font-medium text-green-900">Store:</span>{" "}
                  {parsedData.store}
                </p>
              )}
              <p>
                <span className="font-medium text-green-900">QR Code:</span>{" "}
                {result.length > 50 ? result.slice(0, 50) + "..." : result}
              </p>
            </div>

            <p className="text-green-600 text-center font-semibold">
              ₹{amount} paid successfully!
            </p>

            <DialogFooter className="mt-4 flex justify-end">
              <Button
                onClick={() => setShowSuccessDialog(false)}
                variant="outline"
              >
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>

      <Card className="mt-10 w-full max-w-6xl p-8 rounded-2xl shadow-md bg-white mx-auto">
        <FoodStalls handlePayNow={handleManualPayNow} />
      </Card>
    </>
  );
};

export default QrScanner;
