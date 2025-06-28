import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Wallet, Clock } from "lucide-react";
import TopUpSection from "@/Modules/User/pages/UserDasboardpage/TopUpSection";
import TransactionHistory from "@/Modules/User/pages/UserDasboardpage/History";
import QRScannerPage from "./Pay";

// Swiper imports
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

const features = [
  { label: "Top Up", icon: <Plus className="w-10 h-10" />, key: "topup" },
  { label: "Pay", icon: <Wallet className="w-10 h-10" />, key: "pay" },
  { label: "History", icon: <Clock className="w-10 h-10" />, key: "history" },
];

const UserHome = () => {
  const [activeFeature, setActiveFeature] = useState("topup");

  return (
    <div className="w-full flex flex-col items-center py-8 bg-[#f4f5f9] min-h-screen">
      {/* Feature Cards Section */}
      <div className="w-full max-w-6xl px-4">
        {/* Swiper for small to md screens */}
        <div className="block md:hidden">
          <Swiper
            spaceBetween={16}
            slidesPerView={1.2}
            breakpoints={{
              480: { slidesPerView: 2 },
              640: { slidesPerView: 2.5 },
            }}
          >
            {features.map((item) => (
              <SwiperSlide key={item.key}>
                <Card
                  onClick={() => setActiveFeature(item.key)}
                  className={`rounded-xl  cursor-pointer transition-transform hover:scale-105 ${
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
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Grid for md and up */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6">
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
      </div>

      {/* Feature Content */}
      <div className="w-full px-4 mt-6">
        {activeFeature === "topup" && <TopUpSection />}
        {activeFeature === "history" && <TransactionHistory />}
        {activeFeature === "pay" && <QRScannerPage />}
      </div>
    </div>
  );
};

export default UserHome;