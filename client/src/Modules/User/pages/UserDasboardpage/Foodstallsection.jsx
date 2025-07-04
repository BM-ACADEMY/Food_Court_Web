"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Search, CheckCircle2, XCircle, AlertCircle, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

// Define gradient pool
const gradientPool = [
  "bg-gradient-to-r from-[#0d47a1] to-[#1976d2]",
  "bg-gradient-to-r from-[#4a148c] to-[#7b1fa2]",
  "bg-gradient-to-r from-[#00695c] to-[#004d40]",
  "bg-gradient-to-r from-[#ff6f00] to-[#ff8f00]",
  "bg-gradient-to-r from-[#c2185b] to-[#ad1457]",
  "bg-gradient-to-r from-[#1565c0] to-[#1e88e5]",
  "bg-gradient-to-r from-[#6a1b9a] to-[#8e24aa]",
  "bg-gradient-to-r from-[#283593] to-[#3f51b5]",
];

// Single icon for all restaurants
const restaurantIcon = <ShoppingCart size={48} />;
``
const FoodStalls = ({ handlePayNow }) => {
  const [search, setSearch] = useState("");
  const [restaurants, setRestaurants] = useState([]);
  const [amount, setAmount] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // Prevent multiple submissions
  const [error, setError] = useState(null);
  const { user, loading: authLoading } = useAuth();

  // Fetch restaurants on mount
  useEffect(() => {
    const fetchRestaurants = async () => {
      if (authLoading || !user) {
        setError("Please log in to view restaurants.");
        setLoading(false);
        return;
      }

      try {
        console.log("Fetching from:", `${import.meta.env.VITE_BASE_URL}/restaurants/fetch-all-restaurant`);
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/restaurants/fetch-all-restaurant`,
          { withCredentials: true }
        );
        console.log("Restaurants response:", response.data);
        const restaurantData = response.data.data || [];
        if (!restaurantData.length) {
          setError("No active restaurants found.");
        }
        setRestaurants(restaurantData);
        setLoading(false);
      } catch (err) {
        console.error("Fetch restaurants error:", err.response?.data, err.message);
        setError(err.response?.data?.message || "Failed to fetch restaurants. Please try again.");
        setIsSuccess(false);
        setShowResultDialog(true);
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, [authLoading, user]);

  // Assign gradients to restaurants
  const restaurantsWithGradients = useMemo(() => {
    return restaurants.map((restaurant, index) => ({
      ...restaurant,
      gradient: gradientPool[index % gradientPool.length],
      icon: restaurantIcon,
    }));
  }, [restaurants]);

  // Filter restaurants based on search
  const filteredRestaurants = restaurantsWithGradients.filter((restaurant) =>
    restaurant.restaurant_name?.toLowerCase().includes(search.toLowerCase())
  );

  // Handle restaurant card click to show details
  const handleShowDetails = (restaurant) => {
    setSelectedRestaurant({
      restaurant_name: restaurant.restaurant_name,
      user_id: restaurant.user_id?._id,
      owner_name: restaurant.user_id?.name || "Unknown",
      qr_code: restaurant.qr_code,
      restaurant_id: restaurant.restaurant_id,
      status: restaurant.status,
    });
    setShowDetailsDialog(true);
  };

  // Handle proceed to pay from details dialog
  const handleProceedToPay = () => {
    if (!user || user.role?.role_id !== "role-5") {
      setResultMessage("Only customers can make payments.");
      setIsSuccess(false);
      setShowResultDialog(true);
      setShowDetailsDialog(false);
      return;
    }
    setShowDetailsDialog(false);
    setShowPaymentDialog(true);
  };

  // Handle payment submission (adapted from QrScanner's handlePaymentSubmit)
  const handlePayment = async () => {
    if (!user || user.role?.role_id !== "role-5" || !user._id) {
      setResultMessage("Please log in as a customer to make payments.");
      setIsSuccess(false);
      setShowResultDialog(true);
      setShowPaymentDialog(false);
      return;
    }

    if (!selectedRestaurant?.user_id) {
      setResultMessage("Invalid restaurant selected.");
      setIsSuccess(false);
      setShowResultDialog(true);
      setShowPaymentDialog(false);
      return;
    }

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0 || !/^\d*\.?\d{0,2}$/.test(amount)) {
      setResultMessage("Please enter a valid amount greater than 0 (e.g., 10.00).");
      setIsSuccess(false);
      setShowResultDialog(true);
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const formattedAmount = paymentAmount.toFixed(2);
      console.log("Initiating payment:", {
        amount: formattedAmount,
        sender_id: user._id,
        receiver_id: selectedRestaurant.user_id,
      });

      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/transactions/process-payment`,
        {
          sender_id: user._id,
          receiver_id: selectedRestaurant.user_id,
          amount: formattedAmount,
          transaction_type: "Transfer",
          payment_method: "Gpay",
          status: "Success",
          remarks: `Payment from ${user.name} to ${selectedRestaurant.restaurant_name}`,
        },
        { withCredentials: true }
      );

      console.log("Payment response:", response.data);
      setShowPaymentDialog(false);
      setResultMessage(
        `You have successfully sent ₹${formattedAmount} to ${selectedRestaurant.restaurant_name}. New balance: ₹${response.data.senderBalance.balance}`
      );
      setIsSuccess(true);
      setShowResultDialog(true);
      setAmount(""); // Reset amount
    } catch (err) {
      console.error("Payment failed:", err.response?.data || err.message);
      setResultMessage(err.response?.data?.message || "Payment failed. Please try again.");
      setIsSuccess(false);
      setShowResultDialog(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return <div className="text-center py-12">Loading restaurants...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-600">{error}</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 sm:gap-6">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#00004d]">Restaurants</h2>
        <div className="relative w-full sm:w-64 lg:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search restaurants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 w-full rounded-full shadow-sm focus:ring-2 focus:ring-[#00004d]"
          />
        </div>
      </div>

      {filteredRestaurants.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredRestaurants.map((restaurant) => (
            <Card
              key={restaurant.restaurant_id}
              className="rounded-xl shadow-md overflow-hidden p-0 cursor-pointer hover:shadow-lg transition-shadow duration-300"
              onClick={() => handleShowDetails(restaurant)}
            >
              <div className={`p-6 text-white ${restaurant.gradient}`}>
  <div className="flex flex-col items-center text-center gap-2">
    {restaurant.icon}
    {/* Restaurant name with truncation and tooltip */}
    <h3 
      className="text-lg sm:text-xl font-semibold truncate max-w-[180px] sm:max-w-[220px] w-full"
      title={restaurant.restaurant_name}
    >
      {restaurant.restaurant_name}
    </h3>
    {/* Owner name with truncation and tooltip */}
    <p 
      className="text-sm opacity-90 truncate max-w-[160px] sm:max-w-[200px] w-full"
      title={restaurant.user_id?.name || "Unknown Owner"}
    >
      {restaurant.user_id?.name || "Unknown Owner"}
    </p>
  </div>
</div>
              <CardContent className="p-4">
                <Button
                  className="w-full bg-[#00004d] hover:bg-[#000060] text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShowDetails(restaurant);
                  }}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center text-gray-500 py-12">
          <Search className="w-12 h-12 mb-4 text-gray-400" />
          <p className="text-lg font-semibold">No restaurants found</p>
          <p className="text-sm">Try a different search term or check back later.</p>
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-md w-[90vw] max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-2xl border border-gray-200">
          {/* Header with truncated restaurant name */}
          <DialogHeader className="border-b pb-3">
            <div className="flex items-center gap-3">
              <Info className="w-6 h-6 text-[#00004d] flex-shrink-0" />
              <DialogTitle
                className="text-xl sm:text-2xl font-bold text-[#00004d] truncate max-w-[200px] sm:max-w-[290px]"
                title={selectedRestaurant?.restaurant_name}
              >
                {selectedRestaurant?.restaurant_name}
              </DialogTitle>
            </div>
          </DialogHeader>

          {/* Content with all fields */}
          <div className="space-y-4 py-4">
            <div className="grid gap-3 text-sm">
              {/* Owner field with truncation */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="font-semibold text-gray-700 w-28">Owner:</span>
                <p
                  className="text-gray-600 truncate max-w-[160px] sm:max-w-[220px]"
                  title={selectedRestaurant?.owner_name}
                >
                  {selectedRestaurant?.owner_name || "N/A"}
                </p>
              </div>

              {/* Restaurant ID field with truncation */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="font-semibold text-gray-700 w-28">Restaurant ID:</span>
                <p
                  className="text-gray-600 truncate max-w-[160px] sm:max-w-[220px]"
                  title={selectedRestaurant?.restaurant_id}
                >
                  {selectedRestaurant?.restaurant_id || "N/A"}
                </p>
              </div>

              {/* QR Code field with truncation */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="font-semibold text-gray-700 w-28">QR Code:</span>
                <p
                  className="text-gray-600 truncate max-w-[160px] sm:max-w-[220px]"
                  title={selectedRestaurant?.qr_code}
                >
                  {selectedRestaurant?.qr_code || "N/A"}
                </p>
              </div>

              {/* Status field */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="font-semibold text-gray-700 w-28">Status:</span>
                <p className="text-gray-600">
                  {selectedRestaurant?.status || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Footer with action buttons */}
          <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button
              onClick={() => setShowDetailsDialog(false)}
              className="w-full sm:w-auto bg-gray-200 hover:bg-gray-300 text-gray-800 transition-colors"
            >
              Close
            </Button>
            <Button
              onClick={handleProceedToPay}
              className="w-full sm:w-auto bg-[#00004d] hover:bg-[#000060] text-white transition-colors"
              disabled={!user || user.role?.role_id !== "role-5"}
            >
              Proceed to Pay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md w-[90vw] max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-2xl border border-gray-200">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-xl sm:text-2xl font-bold text-[#00004d]">
              Pay to {selectedRestaurant?.restaurant_name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            <label htmlFor="paymentAmount" className="text-sm font-medium text-gray-700">
              Amount to Pay
            </label>
            <div className="relative flex items-center gap-2">
              <span className="text-lg text-gray-600">₹</span>
              <Input
                id="paymentAmount"
                type="number"
                min="0.01"
                step="0.01"
                className="h-10 px-3 text-sm rounded-lg border-gray-300 focus:ring-2 focus:ring-[#00004d]"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="bg-[#f4f6ff] border text-sm text-gray-700 px-4 py-2 rounded mb-4 space-y-1">
              <p>
                <span className="font-medium text-[#00004d]">Store:</span>{" "}
                {selectedRestaurant?.restaurant_name || "N/A"}
              </p>
              <p>
                <span className="font-medium text-[#00004d]">Owner:</span>{" "}
                {selectedRestaurant?.owner_name || "N/A"}
              </p>
              <p>
                <span className="font-medium text-[#00004d]">QR Code:</span>{" "}
                {selectedRestaurant?.qr_code?.length > 50
                  ? selectedRestaurant.qr_code.slice(0, 50) + "..."
                  : selectedRestaurant?.qr_code || "N/A"}
              </p>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            {/* <Button
              onClick={() => setShowPaymentDialog(false)}
              className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 text-white transition-colors"
            >
              Cancel
            </Button> */}
            <Button
              onClick={handlePayment}
              className="w-full sm:w-auto bg-[#000066] hover:bg-[#000080] text-white transition-colors"
              disabled={!amount || !user || user.role?.role_id !== "role-5" || isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Pay Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="sm:max-w-md w-[90vw] max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-2xl border border-gray-200">
          <DialogHeader className="border-b pb-3">
            <div className={`flex items-center gap-3 ${isSuccess ? "text-green-600" : "text-red-600"}`}>
              {isSuccess ? (
                <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
              ) : (
                <XCircle className="w-6 h-6 flex-shrink-0" />
              )}
              <DialogTitle className="text-xl sm:text-2xl font-bold">
                {isSuccess ? "Payment Successful" : "Payment Failed"}
              </DialogTitle>
            </div>
          </DialogHeader>
          <div className="flex flex-col items-center text-center gap-4 py-6">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center ${isSuccess ? "bg-green-100" : "bg-red-100"
                }`}
            >
              {isSuccess ? (
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              ) : (
                <AlertCircle className="w-10 h-10 text-red-600" />
              )}
            </div>
            <div className="space-y-2">
              <p className="text-gray-700 font-medium text-sm sm:text-base">{resultMessage}</p>
              <p className="text-xs sm:text-sm text-gray-500">
                {isSuccess ? "Transaction completed successfully" : "Please try again or contact support"}
              </p>
            </div>
          </div>
          <DialogFooter className="flex justify-center pt-4 border-t">
            <Button
              onClick={() => setShowResultDialog(false)}
              className={`w-full sm:w-auto ${isSuccess
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
                } text-white transition-colors`}
            >
              {isSuccess ? "Continue" : "Try Again"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FoodStalls;