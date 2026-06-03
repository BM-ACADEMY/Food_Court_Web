import React, { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Wallet, Clock, ShoppingBag } from "lucide-react";
import TopUpSection from "@/Modules/User/pages/UserDasboardpage/TopUpSection";
import TransactionHistory from "@/Modules/User/pages/UserDasboardpage/History";
import QRScannerPage from "./Pay";
import MyOrdersUser from "./MyOrders";



const features = [
  { label: "Top Up", icon: <Plus className="w-10 h-10" />, key: "topup" },
  { label: "Pay", icon: <Wallet className="w-10 h-10" />, key: "pay" },
  { label: "History", icon: <Clock className="w-10 h-10" />, key: "history" },
  { label: "My Orders", icon: <ShoppingBag className="w-10 h-10" />, key: "myorders" },
];

const UserHome = () => {
  const [activeFeature, setActiveFeature] = useState("topup");
  const contentRef = useRef(null);

  const handleFeatureClick = (key) => {
    setActiveFeature(key);
    setTimeout(() => {
      contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  return (
    <div className="w-full flex flex-col items-center py-8 bg-[#f4f5f9] min-h-screen">
      {/* Feature Cards Section */}
      <div className="w-full max-w-6xl px-4">
        {/* Flex column for small to md screens */}
        <div className="flex flex-col gap-4 md:hidden">
          {features.map((item) => (
            <Card
              key={item.key}
              onClick={() => handleFeatureClick(item.key)}
              className={`rounded-xl cursor-pointer transition-transform hover:scale-105 ${
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

        {/* Grid for md and up */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((item) => (
            <Card
              key={item.key}
              onClick={() => handleFeatureClick(item.key)}
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
      </div>

      {/* Feature Content */}
      <div ref={contentRef} className="w-full px-4 mt-6">
        {activeFeature === "topup" && <TopUpSection />}
        {activeFeature === "history" && <TransactionHistory />}
        {activeFeature === "pay" && <QRScannerPage />}
        {activeFeature === "myorders" && <MyOrdersUser />}
      </div>
    </div>
  );
};

export default UserHome;