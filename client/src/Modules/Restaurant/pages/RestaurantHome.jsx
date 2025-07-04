"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Wallet, ClipboardList, ArrowRight, QrCode } from "lucide-react";

const cardOptions = [
  {
    title: "Deduct / Refund",
    description: "Process customer payments and refunds",
    icon: <Wallet className="text-white" size={40} />,
    bgColor: "#000052",
    hoverColor: "#1f296b",
    route: "/restaurant/deduct-refund",
  },
  {
    title: "Restaurant History",
    description: "View all transaction records",
    icon: <ClipboardList className="text-white" size={40} />,
    bgColor: "#1f7b3c",
    hoverColor: "#16612d",
    route: "/restaurant/history",
  },
 {
  title: "QR Code",
  description: "Scan or view restaurant QR code",
  icon: <QrCode className="text-white" size={40} />,
  bgColor: "#8200db", 
  hoverColor: "#6900b1", 
  route: "/restaurant/qrcode",
}
];

const RestaurantDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] md:min-h-[80vh] bg-[#f9fafb] px-6 py-10 flex flex-col items-center gap-10">
      {/* Welcome Banner */}
      <div className="bg-[#000052] text-white px-6 py-6 rounded-xl shadow-md w-full max-w-4xl text-center">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">
          Welcome to Pegasus 2k25 Food Court
        </h1>
        <p className="text-sm sm:text-base text-white/90">
          Select an option below to continue
        </p>
      </div>

      {/* Cards Section */}
      <div className="flex justify-center w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl w-full">
          {cardOptions.map((card, index) => (
            <Card
              key={index}
              className="rounded-xl shadow-md p-0 overflow-hidden flex flex-col h-full"
            >
              <div
                className="p-5 flex justify-center"
                style={{ backgroundColor: card.bgColor }}
              >
                {card.icon}
              </div>
              <CardContent className="text-center py-6 flex flex-col flex-grow">
                <CardTitle className="text-xl font-bold mb-2">{card.title}</CardTitle>
                <CardDescription className="mb-4 text-gray-600">
                  {card.description}
                </CardDescription>
                <div className="flex justify-center mt-auto">
                  <Button
                    className="text-white px-6 py-3 text-base flex items-center gap-2"
                    style={{ backgroundColor: card.bgColor }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = card.hoverColor;
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = card.bgColor;
                    }}
                    onClick={() => navigate(card.route)}
                  >
                    Open <ArrowRight size={18} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RestaurantDashboard;
