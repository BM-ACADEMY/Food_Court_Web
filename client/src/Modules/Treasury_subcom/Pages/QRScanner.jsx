// In components/QRScanner.jsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Add Input component from shadcn
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QrCode, ScanLine } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import axios from "axios";
import TopUpOnline from "./TopUpOnline";

function QRScanner() {
  const [scannedData, setScannedData] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showTopUp, setShowTopUp] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(""); // New state for phone number input

  const qrRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:4000/api";

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
        { fps: 30, qrbox: { width: 400, height: 500 } },
        handleScanSuccess,
        (error) => console.warn("QR scan error:", error)
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

  const handleScanSuccess = async (decodedText) => {
    if (typeof decodedText === "string" && decodedText.trim() !== "") {
      setLoading(true);
      setError("");

      try {
        const qrCode = encodeURIComponent(decodedText.trim());

        const customerResponse = await axios.get(
          `${BASE_URL}/customers/fetch-by-qr?qr_code=${qrCode}`,
          { withCredentials: true }
        );

        if (!customerResponse.data.success) {
          throw new Error(customerResponse.data.message || "Customer not found.");
        }

        const { customer_id, user_id } = customerResponse.data.data;

        const detailsResponse = await axios.get(
          `${BASE_URL}/customers/fetch-customer-details-by-qr?qr_code=${qrCode}`,
          { withCredentials: true }
        );

        if (!detailsResponse.data.success) {
          throw new Error(detailsResponse.data.message || "Customer details not found.");
        }

        const { name, phone_number, email, balance } = detailsResponse.data.data;

        const balanceValue =
          balance !== "Payment not done yet" ? parseFloat(balance.toString()) : 0;

        const newScannedData = {
          customerId: customer_id || "N/A",
          userId: user_id,
          name: name || "N/A",
          phone: phone_number || "N/A",
          email: email || "N/A",
          currentBalance: balanceValue,
        };

        console.log("Scanned customer data:", newScannedData);
        setScannedData(newScannedData);
        setScannerOpen(false);
        await stopScanner();
      } catch (err) {
        console.error("API error:", err);
        setError(err.message || "Failed to fetch customer details.");
      } finally {
        setLoading(false);
      }
    } else {
      setError("Invalid QR code. Please scan a valid one.");
    }
  };

  // New function to handle phone number search
  const handlePhoneSearch = async () => {
    if (!phoneNumber) {
      setError("Please enter a phone number.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.get(
        `${BASE_URL}/customers/fetch-customer-details-by-phone?phone_number=${encodeURIComponent(phoneNumber)}`,
        { withCredentials: true }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Customer not found.");
      }

      const { customer_id, user_id, name, email, phone_number, balance } = response.data.data;

      const balanceValue =
        balance !== "Payment not done yet" ? parseFloat(balance.toString()) : 0;

      const newScannedData = {
        customerId: customer_id || "N/A",
        userId: user_id,
        name: name || "N/A",
        phone: phone_number || "N/A",
        email: email || "N/A",
        currentBalance: balanceValue,
      };

      console.log("Phone search customer data:", newScannedData);
      setScannedData(newScannedData);
    } catch (err) {
      console.error("Phone search error:", err);
      setError(err.message || "Failed to fetch customer details.");
    } finally {
      setLoading(false);
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

  const handleProceedToTopup = () => {
    if (scannedData) {
      console.log("Proceeding to TopUpOnline with:", scannedData);
      setShowTopUp(true);
    }
  };

  const handleBackToScanner = () => {
    setShowTopUp(false);
    setScannedData(null);
    setError("");
    setPhoneNumber(""); // Reset phone number input
  };

  if (showTopUp && scannedData) {
    return (
      <TopUpOnline
        customer={{
          name: scannedData.name,
          phone: scannedData.phone,
          user_id: scannedData.userId,
          customer_id: scannedData.customerId,
          email: scannedData.email,
          currentBalance: scannedData.currentBalance,
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 flex justify-center">
      <div className="w-full max-w-xl">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-center">QR Code Scanner</h2>

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
              {loading && (
                <p className="text-blue-500 text-sm mt-2">Fetching customer details...</p>
              )}
              <Button
                onClick={() => setScannerOpen(false)}
                className="mt-4 bg-[#070149] hover:bg-[#3f3b6d] text-white"
              >
                Close
              </Button>
            </DialogContent>
          </Dialog>

          {/* Phone Number Search Box */}
          <div className="mt-4">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full"
              />
              <Button
                onClick={handlePhoneSearch}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading}
              >
                {loading ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 p-2 rounded mt-4">{error}</p>
          )}

          {scannedData && !error && (
            <div className="space-y-2 p-4 rounded-md text-sm border-t mt-4">
              <p><strong>Customer ID:</strong> {scannedData.customerId}</p>
              <p><strong>Name:</strong> {scannedData.name}</p>
              <p><strong>Phone:</strong> {scannedData.phone}</p>
              <p>
                <strong>Current Balance:</strong>{" "}
                {scannedData.currentBalance === 0
                  ? "Payment not done yet"
                  : `₹${scannedData.currentBalance.toFixed(2)}`}
              </p>
              <Button
                onClick={handleProceedToTopup}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Proceed to Topup
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default QRScanner;