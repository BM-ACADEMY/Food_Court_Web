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
import { Wallet, ClipboardList, ArrowRight, ArrowLeft, QrCode, Package, ShoppingBag } from "lucide-react";
import { useOrders } from "@/context/OrderContext";

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
  },
  {
    title: "Manage Products",
    description: "Add, update, or remove menu items",
    icon: <Package className="text-white" size={40} />,
    bgColor: "#d35400",
    hoverColor: "#b04600",
    route: "/restaurant/products",
  },
  {
    title: "My Orders",
    description: "View live customer orders",
    icon: <ShoppingBag className="text-white" size={40} />,
    bgColor: "#c2185b",
    hoverColor: "#931144",
    route: "/restaurant/my-orders",
  }
];

const RestaurantDashboard = () => {
  const navigate = useNavigate();
  const { unreadOrdersCount } = useOrders();

  return (
    <div className="min-h-[60vh] md:min-h-[80vh] bg-[#f9fafb] px-6 py-10 flex flex-col items-center gap-10">
      <div className="w-full max-w-4xl flex justify-start -mb-6">
        {/* <Button variant="ghost" onClick={() => navigate(-1)} className="cursor-pointer gap-2 -ml-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button> */}
      </div>
      {/* Welcome Banner */}
      <div className="bg-[#000052] text-white px-6 py-6 rounded-xl shadow-md w-full max-w-4xl text-center">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">
          Welcome to PEGASUS 2K26 Food Court
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
                className="p-5 flex justify-center relative"
                style={{ backgroundColor: card.bgColor }}
              >
                {card.title === "My Orders" && unreadOrdersCount > 0 && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold shadow-lg">
                    {unreadOrdersCount}
                  </div>
                )}
                {card.icon}
              </div>
              <CardContent className="text-center py-6 flex flex-col flex-grow">
                <CardTitle className="text-xl font-bold mb-2">{card.title}</CardTitle>
                <CardDescription className="mb-4 text-gray-600">
                  {card.description}
                </CardDescription>
                <div className="flex justify-center mt-auto">
                  <Button
                    className="text-white px-6 py-3 text-base flex items-center gap-2 cursor-pointer"
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
