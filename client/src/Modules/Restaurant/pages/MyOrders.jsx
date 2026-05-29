import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/context/OrderContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const PER_PAGE = 10;

const MyOrders = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { clearUnreadOrders } = useOrders();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      // Fetch transfers where the restaurant is the receiver
      const res = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/transactions/fetch-all-transaction?userId=${user._id}&typeFilter=Transfer`,
        { withCredentials: true }
      );
      
      const allTransactions = res.data.data || [];
      
      // Filter out transactions that aren't specifically "Orders" received by this user
      const filteredOrders = allTransactions.filter(
        (tx) => tx.receiver_id._id === user._id && tx.remarks && tx.remarks.startsWith("Order:")
      );
      
      setOrders(filteredOrders);
    } catch (err) {
      console.error("Failed to load orders:", err);
      toast.error("Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && user) {
      fetchOrders();
      clearUnreadOrders();
    }
  }, [user, loading]);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;

  const updateOrderStatus = async (transactionId, newStatus) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_BASE_URL}/transactions/update-order-status/${transactionId}`,
        { order_status: newStatus },
        { withCredentials: true }
      );
      toast.success(`Order marked as ${newStatus}`);
      fetchOrders(); // Refresh the list
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error("Failed to update order status");
    }
  };

  const totalPages = Math.ceil(orders.length / PER_PAGE);
  const paginatedOrders = orders.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto bg-[#f9fafb]">
      <div className="mb-4">
        <Button variant="ghost" onClick={() => navigate("/restaurant")} className="gap-2 text-[#000052]">
          <ArrowLeft size={16} /> Back
        </Button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-[#000052] flex items-center gap-2">
          <ShoppingBag className="text-[#000052]" /> My Orders
        </h2>
      </div>

      {orders.length === 0 ? (
        <Card className="border-dashed border-2 bg-gray-50 mt-10">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <ShoppingBag size={48} className="text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-700 mb-2">No active orders yet</h3>
            <p className="text-gray-500">When customers place an order online, they will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-x-auto">
          <table className="w-full text-sm text-left border-t">
            <thead className="bg-[#f0f4f8] text-[#000052] uppercase text-xs">
              <tr>
                <th className="p-4 font-semibold">Txn ID</th>
                <th className="p-4 font-semibold">Customer</th>
                <th className="p-4 font-semibold">Amount</th>
                <th className="p-4 font-semibold">Items</th>
                <th className="p-4 font-semibold">Date & Time</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map((order) => (
                <tr key={order._id} className="border-t hover:bg-gray-50">
                  <td className="p-4 text-gray-600 font-medium">{order.transaction_id || order._id.slice(-6)}</td>
                  <td className="p-4 font-semibold text-gray-800">{order.sender_id.name || "Customer"}</td>
                  <td className="p-4 font-bold text-green-600">₹{parseFloat(order.amount).toFixed(2)}</td>
                  <td className="p-4">
                    <ul className="list-disc pl-4 text-gray-700">
                      {order.remarks.replace("Order: ", "").split(", ").map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="p-4 text-gray-500 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-xs">
                      <Clock size={12} />
                      {formatDate(order.created_at)}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <select
                        value={order.order_status || "Pending"}
                        onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-[#000052]"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Preparing">Preparing</option>
                        <option value="Ready">Ready</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                      <span className="bg-[#e6f4ea] text-[#137333] px-2 py-1 rounded text-xs font-semibold whitespace-nowrap">
                        Paid
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t flex justify-center bg-gray-50">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage((p) => p - 1);
                      }}
                    />
                  </PaginationItem>
                  {[...Array(totalPages)].map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === i + 1}
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(i + 1);
                        }}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) setCurrentPage((p) => p + 1);
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
