import React, { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Info } from "lucide-react";
import QRCode from "qrcode";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";

const TopUpSection = () => {
  const { user } = useAuth();
  const [qrDataUrl, setQrDataUrl] = useState("");
  const canvasRef = useRef(null);

  useEffect(() => {
    const generateQrCode = async () => {
      if (!user?._id) return;

      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/customers/fetch-by-qr`,
          {
            params: { qr_code: user?.qr_code || "" },
            withCredentials: true,
          }
        );

        const qr_code = res.data?.data?.qr_code;

        if (qr_code) {
          const url = await QRCode.toDataURL(qr_code);
          setQrDataUrl(url);
        }
      } catch (err) {
        console.error("Failed to fetch QR code:", err);
      }
    };

    generateQrCode();
  }, [user]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = "pegasus-qr-code.png";
    link.click();
  };

  return (
    <Card className="mt-10 w-full max-w-6xl p-8 rounded-2xl shadow-md bg-white mx-auto">
      <h2 className="text-2xl font-bold text-[#00004d] mb-6">Add Money to Your Wallet</h2>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <div className="relative w-full max-w-sm border-2 border-dashed border-[#000052] rounded-xl p-4 bg-[#f5f6fb] shadow-inner">
            <p className="absolute -top-4 left-4 text-xs font-medium bg-white px-2 py-0.5 rounded shadow text-[#000052]">
              Scan QR Code
            </p>
            <div className="w-full h-48 flex items-center justify-center">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Generated QR Code" className="h-full object-contain" />
              ) : (
                <p className="text-sm text-gray-500">Loading QR...</p>
              )}
            </div>
            <div className="mt-4 text-center">
              <Button
                onClick={handleDownload}
                className="bg-[#000066] hover:bg-[#000080] text-white text-sm"
              >
                <Download className="mr-2 h-4 w-4" /> Download QR
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-white/50 backdrop-blur-lg border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-[#00004d] mb-3">How to Top Up</h3>

          <ul className="space-y-4 text-gray-700 text-sm">
            {[
              "Show this QR code at any Pegasus 2025 Treasury Reception",
              "Tell the cashier how much you want to add",
              "Pay the amount and your wallet will be updated instantly",
            ].map((text, index) => (
              <li key={index} className="flex gap-3 items-start">
                <span className="bg-[#000066] text-white min-w-6 min-h-6 rounded-full flex items-center justify-center text-xs font-bold mt-1">
                  {index + 1}
                </span>
                <span className="flex-1">{text}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center text-xs text-gray-500">
            <Info className="w-4 h-4 mr-2 text-[#000066]" />
            Treasury hours: <span className="ml-1 font-medium text-[#000066]">9:00 AM - 10:00 PM</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TopUpSection;
