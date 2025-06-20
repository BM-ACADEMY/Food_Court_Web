import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Wallet, Clock } from "lucide-react";
import TopUpSection from "@/Modules/User/pages/UserDasboardpage/TopUpSection";
import TransactionHistory from "@/Modules/User/pages/UserDasboardpage/History";
import QRScannerPage from "./Pay";

const features = [
  { label: "Top Up", icon: <Plus className="w-6 h-6" />, key: "topup" },
  { label: "Pay", icon: <Wallet className="w-6 h-6" />, key: "pay" },
  { label: "History", icon: <Clock className="w-6 h-6" />, key: "history" },
];

const UserHome = () => {
  const [activeFeature, setActiveFeature] = useState("topup");

  return (
    <div className="w-full flex flex-col items-center py-8 bg-[#f4f5f9] min-h-screen">
      {/* Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-6xl w-full px-4">
        {features.map((item) => (
          <Card
            key={item.key}
            onClick={() => setActiveFeature(item.key)}
            className={`rounded-xl shadow-md cursor-pointer transition-transform hover:scale-105 ${
              activeFeature === item.key
                ? "bg-[#000066] text-white"
                : "bg-white text-black"
            }`}
          >
            <CardContent className="flex flex-col items-center justify-center py-6">
              {item.icon}
              <p className="mt-2 text-sm font-semibold">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>


      <div className="w-full px-4">
        {activeFeature === "topup" && <TopUpSection />}
        {activeFeature === "history" && <TransactionHistory />}
        {activeFeature === "pay" && <QRScannerPage />}
       
      </div>
    </div>
  );
};

export default UserHome;
