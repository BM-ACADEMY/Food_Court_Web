"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Html5QrcodeScanner,
  Html5QrcodeScanType,
} from "html5-qrcode";
import { Button } from "@/components/ui/button";
import {
  ScanLine,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const QrScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const scannerRef = useRef(null);

  const startScanner = () => {
    setCameraStarted(true);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current
        .clear()
        .then(() => scannerRef.current = null)
        .catch((error) => {
          console.error("Failed to clear scanner", error);
        });
      setCameraStarted(false);
    }
  };

  useEffect(() => {
    if (!cameraStarted) return;

    const html5QrcodeScanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: 250,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
      },
      false
    );

    scannerRef.current = html5QrcodeScanner;

    html5QrcodeScanner.render(
      (decodedText) => {
        setScanResult(decodedText);
        setShowDialog(true);
        stopScanner();
      },
      (error) => {
        console.warn("QR Scan error:", error);
      }
    );

    return () => {
      html5QrcodeScanner
        .clear()
        .then(() => (scannerRef.current = null))
        .catch((error) =>
          console.error("Error clearing scanner on unmount", error)
        );
    };
  }, [cameraStarted]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(scanResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed", error);
    }
  };

  const openInNewTab = () => {
    if (scanResult) {
      window.open(scanResult, "_blank");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 text-center pt-24">
      {!cameraStarted && (
        <ScanLine className="mx-auto mb-6 w-24 h-24 text-black" />
      )}

      <h1 className="text-2xl font-semibold mb-4">QR Code Scanner</h1>

      {!cameraStarted ? (
        <Button onClick={startScanner}>Start Scanner</Button>
      ) : (
        <>
          <div id="qr-reader" className="w-full mx-auto mb-4 rounded-md overflow-hidden" />
          <Button onClick={stopScanner}>Stop Scanner</Button>
        </>
      )}

      {/* Scan Result Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan Result</DialogTitle>
          </DialogHeader>
          <p className="text-gray-700 whitespace-pre-wrap break-all">
            {scanResult}
          </p>
          <DialogFooter className="flex gap-2 justify-end items-center">
            <Button variant="outline" onClick={openInNewTab}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Open
            </Button>
            <Button variant="outline" onClick={copyToClipboard}>
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-green-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QrScanner;
