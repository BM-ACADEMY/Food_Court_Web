"use client";

import React, { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import QRCode from "qrcode";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const QrCodePage = () => {
  const { user, loading } = useAuth();
  const [qrCodeImage, setQrCodeImage] = useState(null);
  const [error, setError] = useState(null);
  const qrImageRef = useRef(null); // QR image reference

  useEffect(() => {
    if (!loading && user) {
      const fetchRestaurantQrCode = async () => {
        try {
          const res = await axios.get(
            `${import.meta.env.VITE_BASE_URL}/restaurants/fetch-restaurant-by-id/${user.r_id}`,
            { withCredentials: true }
          );

          const qrCodeData = res.data.data.qr_code;
          if (qrCodeData) {
            const qrCodeUrl = await QRCode.toDataURL(qrCodeData, {
              width: 200,
              margin: 2,
            });
            setQrCodeImage(qrCodeUrl);
          } else {
            setError("No QR code found for this restaurant.");
          }
        } catch (err) {
          console.error("Error fetching QR code:", err);
          setError("Failed to load QR code.");
        }
      };

      if (user.r_id) {
        fetchRestaurantQrCode();
      } else {
        setError("No restaurant associated with this user.");
      }
    }
  }, [user, loading]);

  const handleDownload = () => {
    if (qrCodeImage) {
      const link = document.createElement("a");
      link.href = qrCodeImage;
      link.download = "restaurant-qr-code.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

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
            <>
              <img
                ref={qrImageRef}
                src={qrCodeImage}
                alt="Restaurant QR Code"
                className="mx-auto mb-4"
              />
              <Button onClick={handleDownload} variant="outline" className="gap-2 mt-2 cursor-pointer">
                <Download className="h-4 w-4" />
                Download QR Code
              </Button>
            </>
          ) : (
            <p className="text-sm text-gray-500">Generating QR code...</p>
          )}
          <p className="text-sm text-gray-500 mt-2">
            Scan this QR code to pay or view menu
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default QrCodePage;
