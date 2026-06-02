// src/layouts/RestaurantLayout.tsx
import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import RestaurantHeader from "@/Modules/Restaurant/components/Header/Navbar";
import Footer from "@/Modules/Restaurant/components/Footer/Footer";
import { io } from "socket.io-client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";
import { OrderProvider, useOrders } from "@/context/OrderContext";

function RestaurantLayoutInner() {
  const { user, loading } = useAuth();
  const { incrementUnreadOrders } = useOrders();

  useEffect(() => {
    if (loading || !user || !user._id) return;

    // Connect to the socket server (strip /api if present in VITE_BASE_URL)
    const socketUrl = import.meta.env.VITE_BASE_URL.replace(/\/api\/?$/, "");
    const socket = io(socketUrl, {
      withCredentials: true,
    });

    socket.on("connect", () => {
      // Join the room using user ID (receiver_id)
      socket.emit("joinRestaurantRoom", user._id.toString());
    });

    socket.on("newTransaction", (data) => {
      const { transaction } = data;
      // If the transaction is received by this user and is an Order
      if (
        transaction &&
        transaction.receiver_id.toString() === user._id.toString() &&
        transaction.remarks &&
        transaction.remarks.startsWith("Order:")
      ) {
        incrementUnreadOrders();
        toast.info(`🛒 New Order Received! ${transaction.remarks.replace("Order: ", "")}`, {
          position: "top-right",
          autoClose: 10000, // keep it open for 10 seconds
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user, loading]);

  return (
    <>
      <RestaurantHeader />
      <Outlet />
      <Footer />
    </>
  );
}

export default function RestaurantLayout() {
  return (
    <OrderProvider>
      <RestaurantLayoutInner />
    </OrderProvider>
  );
}
