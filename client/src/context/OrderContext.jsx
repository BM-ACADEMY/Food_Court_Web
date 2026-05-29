import React, { createContext, useContext, useState } from "react";

const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [unreadOrdersCount, setUnreadOrdersCount] = useState(() => {
    const saved = localStorage.getItem("unreadOrdersCount");
    return saved ? parseInt(saved, 10) : 0;
  });

  const incrementUnreadOrders = () => {
    setUnreadOrdersCount((prev) => {
      const newCount = prev + 1;
      localStorage.setItem("unreadOrdersCount", newCount);
      return newCount;
    });
  };

  const clearUnreadOrders = () => {
    setUnreadOrdersCount(0);
    localStorage.setItem("unreadOrdersCount", 0);
  };

  return (
    <OrderContext.Provider value={{ unreadOrdersCount, incrementUnreadOrders, clearUnreadOrders }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => useContext(OrderContext);
