"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import QRCode from "qrcode"; // Import qrcode package
import { useAuth } from "@/context/AuthContext"; // Import AuthContext
import axios from "axios";

const QrCodePage = () => {
  const { user, loading } = useAuth(); // Get user and loading state from AuthContext
  const [qrCodeImage, setQrCodeImage] = useState(null); // State for QR code image
  const [error, setError] = useState(null); // State for error handling

  useEffect(() => {
    if (!loading && user) {
      // Fetch restaurant data for the logged-in user
      const fetchRestaurantQrCode = async () => {
        try {
          // Fetch restaurant data using user_id
          const res = await axios.get(
            `${import.meta.env.VITE_BASE_URL}/restaurants/fetch-restaurant-by-id/${user.r_id}`,
            { withCredentials: true }
          );

          const qrCodeData = res.data.data.qr_code; // Get qr_code from restaurant
          if (qrCodeData) {
            // Generate QR code image from qr_code string
            const qrCodeUrl = await QRCode.toDataURL(qrCodeData, {
              width: 200,
              margin: 2,
            });
            setQrCodeImage(qrCodeUrl); // Set the QR code image
          } else {
            setError("No QR code found for this restaurant.");
          }
        } catch (err) {
          console.error("Error fetching QR code:", err);
          setError("Failed to load QR code.");
        }
      };

      if (user.r_id) {
        // Only fetch if user has a restaurant ID
        fetchRestaurantQrCode();
      } else {
        setError("No restaurant associated with this user.");
      }
    }
  }, [user, loading]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-[60vh] px-4 py-10 flex justify-center items-center bg-[#f9fafb]">
      <Card className="max-w-md w-full text-center shadow-lg p-6">
        <CardTitle className="text-xl font-bold mb-4">Restaurant QR Code</CardTitle>
        <CardContent>
          {error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : qrCodeImage ? (
            <img
              src={qrCodeImage}
              alt="Restaurant QR Code"
              className="mx-auto mb-4"
            />
          ) : (
            <p className="text-sm text-gray-500">Generating QR code...</p>
          )}
          <p className="text-sm text-gray-500">Scan this QR code to pay or view menu</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default QrCodePage;