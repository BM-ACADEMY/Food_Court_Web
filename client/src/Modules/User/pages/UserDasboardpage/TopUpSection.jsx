import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Info } from "lucide-react";

const TopUpSection = () => {
  const qrImageUrl = "https://api.qrserver.com/v1/create-qr-code/?data=pegasus-2025-topup&size=200x200";

  const handleDownload = async () => {
    try {
      const response = await fetch(qrImageUrl, { mode: "cors" });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "pegasus-qr-code.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("QR code download failed:", error);
    }
  };

  return (
    <Card className="mt-10 w-full max-w-6xl p-8 rounded-2xl shadow-md bg-white mx-auto">
      <h2 className="text-2xl font-bold text-[#00004d] mb-6">Add Money to Your Wallet</h2>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: QR Code Box */}
        <div className="flex-1">
          <div className="relative w-full max-w-sm border-2 border-dashed border-[#000052] rounded-xl p-4 bg-[#f5f6fb] shadow-inner">
            <p className="absolute -top-4 left-4 text-xs font-medium bg-white px-2 py-0.5 rounded shadow text-[#000052]">
              Scan QR Code
            </p>
            <div className="w-full h-48 flex items-center justify-center">
              <img src={qrImageUrl} alt="QR Code" className="h-full object-contain" />
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

        {/* Right: Instructions */}
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
