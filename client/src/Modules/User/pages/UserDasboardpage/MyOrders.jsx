"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { ShoppingBag, Clock, ChevronLeft, ChevronRight, PackageOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const PER_PAGE = 5;

const statusColors = {
  Pending:   { bg: "bg-yellow-100", text: "text-yellow-700" },
  Preparing: { bg: "bg-blue-100",   text: "text-blue-700"   },
  Ready:     { bg: "bg-purple-100", text: "text-purple-700" },
  Delivered: { bg: "bg-green-100",  text: "text-green-700"  },
  Cancelled: { bg: "bg-red-100",    text: "text-red-700"    },
};

const MyOrdersUser = () => {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders]           = useState([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!authLoading && user) {
      fetchOrders();
    }
  }, [user, authLoading]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/transactions/fetch-all-transaction?userId=${user._id}&typeFilter=Transfer`,
        { withCredentials: true }
      );
      const allTransactions = res.data.data || [];

      // Keep only orders placed BY this customer (sender) with "Order:" remarks
      const myOrders = allTransactions.filter(
        (tx) =>
          tx.sender_id?._id === user._id &&
          tx.remarks &&
          tx.remarks.startsWith("Order:")
      );

      // Sort newest first
      myOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setOrders(myOrders);
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalPages      = Math.ceil(orders.length / PER_PAGE);
  const paginatedOrders = orders.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE
  );

  // Build page number list with ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 5) return [...Array(totalPages)].map((_, i) => i + 1);
    const pages = [];
    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, "...", totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }
    return pages;
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-500 text-sm gap-2">
        <div className="w-5 h-5 border-2 border-[#00004d] border-t-transparent rounded-full animate-spin" />
        Loading your orders...
      </div>
    );
  }

  return (
    <Card className="mt-10 w-full max-w-6xl mx-auto rounded-2xl shadow-md bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b bg-[#f8f9ff]">
        <ShoppingBag className="w-6 h-6 text-[#00004d]" />
        <h2 className="text-xl font-bold text-[#00004d]">My Online Orders</h2>
        {orders.length > 0 && (
          <span className="ml-auto text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {orders.length} order{orders.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <CardContent className="p-0">
        {orders.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <PackageOpen className="w-14 h-14 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-1">No orders yet</h3>
            <p className="text-sm text-gray-400">
              Your online orders will appear here after you place them.
            </p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#f0f4f8] text-[#00004d] uppercase text-xs">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Txn ID</th>
                    <th className="px-5 py-3 font-semibold">Restaurant</th>
                    <th className="px-5 py-3 font-semibold">Items</th>
                    <th className="px-5 py-3 font-semibold">Amount</th>
                    <th className="px-5 py-3 font-semibold">Date &amp; Time</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.map((order) => {
                    const status      = order.order_status || "Pending";
                    const statusStyle = statusColors[status] || statusColors["Pending"];
                    const items       = order.remarks.replace("Order: ", "").split(", ");

                    return (
                      <tr
                        key={order._id}
                        className="border-t hover:bg-gray-50 transition-colors"
                      >
                        {/* Txn ID */}
                        <td className="px-5 py-4 text-gray-500 font-medium whitespace-nowrap">
                          {order.transaction_id || order._id.slice(-8).toUpperCase()}
                        </td>

                        {/* Restaurant */}
                        <td className="px-5 py-4 font-semibold text-gray-800 whitespace-nowrap">
                          {order.receiver_id?.name || "Restaurant"}
                        </td>

                        {/* Items */}
                        <td className="px-5 py-4">
                          <ul className="list-disc pl-4 text-gray-700 space-y-0.5">
                            {items.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </td>

                        {/* Amount */}
                        <td className="px-5 py-4 font-bold text-[#00004d] whitespace-nowrap">
                          ₹{parseFloat(order.amount).toFixed(2)}
                        </td>

                        {/* Date & Time */}
                        <td className="px-5 py-4 text-gray-500 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-xs">
                            <Clock size={12} />
                            {formatDate(order.created_at)}
                          </div>
                        </td>

                        {/* Status badge */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}
                          >
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-5 py-4 border-t bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Info text */}
                <p className="text-xs text-gray-500">
                  Showing{" "}
                  <span className="font-semibold text-gray-700">
                    {(currentPage - 1) * PER_PAGE + 1}–
                    {Math.min(currentPage * PER_PAGE, orders.length)}
                  </span>{" "}
                  of <span className="font-semibold text-gray-700">{orders.length}</span> orders
                </p>

                <Pagination>
                  <PaginationContent>
                    {/* Previous */}
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1) setCurrentPage((p) => p - 1);
                        }}
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-40"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>

                    {/* Page numbers */}
                    {getPageNumbers().map((page, idx) =>
                      page === "..." ? (
                        <PaginationItem key={`ellipsis-${idx}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            isActive={currentPage === page}
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(page);
                            }}
                            className={`cursor-pointer ${
                              currentPage === page
                                ? "bg-[#00004d] text-white hover:bg-[#000060] border-[#00004d]"
                                : ""
                            }`}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}

                    {/* Next */}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages) setCurrentPage((p) => p + 1);
                        }}
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-40"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default MyOrdersUser;
