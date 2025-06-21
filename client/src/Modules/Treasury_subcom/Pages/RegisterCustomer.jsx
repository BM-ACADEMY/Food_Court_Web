"use client";

import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Html5Qrcode } from "html5-qrcode";
import RegistrationSuccess from "./RegistrationSuccess";

import {
  ScanLine,
  User,
  Mail,
  Phone,
  ArrowRightCircle,
} from "lucide-react";

function RegisterCustomer() {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerName: "",
    email: "",
    phoneNumber: "",
  });
  const [isRegistered, setIsRegistered] = useState(false);

  const qrRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const [cameraError, setCameraError] = useState("");

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
        decodedText => handleScanSuccess(decodedText),
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

  const handleScanSuccess = decodedText => {
    try {
      const data = JSON.parse(decodedText);
      if (!data.name || !data.phone || !data.email) {
        alert("Invalid QR data");
        return;
      }

      setFormData({
        customerName: data.name,
        email: data.email,
        phoneNumber: data.phone,
      });

      setIsScannerOpen(false);
      stopScanner();
    } catch (err) {
      console.error("Failed to parse QR:", err);
      alert("Invalid QR Code Format");
    }
  };

useEffect(() => {
  if (isScannerOpen) {
    // Delay to ensure dialog content (qr-reader) is rendered
    const timeout = setTimeout(() => {
      startScanner();
    }, 300); // 300ms delay

    return () => {
      clearTimeout(timeout);
      stopScanner();
    };
  } else {
    stopScanner();
  }
}, [isScannerOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = (e) => {
    e.preventDefault();
    console.log("Registering user:", formData);
    setIsRegistered(true);
  };

  if (isRegistered) {
    return <RegistrationSuccess />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-xl min-h-[600px] pt-0 rounded-b-lg rounded-t-none shadow-lg">
        <CardHeader className="bg-[#070149] pt-0 rounded-t-none">
          <CardTitle className="text-3xl font-bold text-center text-white py-4">
            Register New User
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex justify-center mb-6">
            <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border border-[#070149] text-lg px-6 py-2 flex items-center gap-2"
                >
                  <ScanLine className="w-5 h-5" />
                  Open Scanner
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
                  onClick={() => setIsScannerOpen(false)}
                  className="mt-4 bg-[#070149] hover:bg-[#3f3b6d] text-white"
                >
                  Close
                </Button>
              </DialogContent>
            </Dialog>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <label
                htmlFor="customerName"
                className="block text-lg font-medium text-gray-700 mb-1 items-center gap-2"
              >
                <User className="w-5 h-5 inline" />
                Customer Name
              </label>
              <Input
                id="customerName"
                name="customerName"
                type="text"
                value={formData.customerName}
                onChange={handleInputChange}
                className="text-lg h-12"
                placeholder="Enter customer name"
                required
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-lg font-medium text-gray-700 mb-1 items-center gap-2"
              >
                <Mail className="w-5 h-5 inline" />
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className="text-lg h-12"
                placeholder="Enter email"
                required
              />
            </div>
            <div>
              <label
                htmlFor="phoneNumber"
                className="block text-lg font-medium text-gray-700 mb-1 items-center gap-2"
              >
                <Phone className="w-5 h-5 inline" />
                Phone Number
              </label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="text-lg h-12"
                placeholder="Enter phone number"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 text-lg bg-[#070149] hover:bg-[#3f3b6d] text-white flex items-center justify-center gap-2"
            >
              <ArrowRightCircle className="w-5 h-5" />
              Register User
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default RegisterCustomer;
