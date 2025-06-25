  // "use client";

  // import React, { useEffect, useRef, useState } from "react";
  // import { Html5Qrcode } from "html5-qrcode";
  // import { Button } from "@/components/ui/button";
  // import { QrCode, Play, Square, ScanLine } from "lucide-react";
  // import {
  //   Dialog,
  //   DialogContent,
  //   DialogFooter,
  //   DialogHeader,
  //   DialogTitle,
  // } from "@/components/ui/dialog";
  // import { Input } from "@/components/ui/input";
  // import { Card } from "@/components/ui/card";
  // import FoodStalls from "@/Modules/User/pages/UserDasboardpage/Foodstallsection";

  // const QrScanner = () => {
  //   const qrRef = useRef(null);
  //   const html5QrCodeRef = useRef(null);
  //   const [scanning, setScanning] = useState(false);
  //   const [result, setResult] = useState("");
  //   const [parsedData, setParsedData] = useState({ name: "", store: "" });
  //   const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  //   const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  //   const [amount, setAmount] = useState("");

  //   const startScanner = async () => {
  //     const html5QrCode = new Html5Qrcode("qr-reader");
  //     html5QrCodeRef.current = html5QrCode;

  //     try {
  //       await html5QrCode.start(
  //         { facingMode: "environment" },
  //         { fps: 10, qrbox: { width: 300, height: 150 } },
  //         (decodedText) => {
  //           setResult(decodedText);
  //           try {
  //             const data = JSON.parse(decodedText);
  //             setParsedData({
  //               name: data.name || "",
  //               store: data.store || "",
  //             });
  //           } catch {
  //             setParsedData({ name: "", store: "" });
  //           }
  //           setShowPaymentDialog(true);
  //           stopScanner();
  //         },
  //         (error) => {
  //           console.warn("QR scan error:", error);
  //         }
  //       );
  //       setScanning(true);
  //     } catch (err) {
  //       console.error("Camera start failed:", err);
  //     }
  //   };

  //   const stopScanner = async () => {
  //     if (html5QrCodeRef.current) {
  //       try {
  //         await html5QrCodeRef.current.stop();
  //         await html5QrCodeRef.current.clear();
  //         setScanning(false);
  //       } catch (err) {
  //         console.error("Stop failed:", err);
  //       }
  //     }
  //   };

  //   const handlePaymentSubmit = () => {
  //     if (amount.trim() !== "") {
  //       setShowPaymentDialog(false);
  //       setShowSuccessDialog(true);
  //     }
  //   };

  //   const handleManualPayNow = ({ name, store, result }) => {
  //     setParsedData({ name, store });
  //     setResult(result);
  //     setShowPaymentDialog(true);
  //   };

  //   useEffect(() => {
  //     return () => stopScanner();
  //   }, []);

  //   return (
  //     <>
  //       <Card className="mt-10 w-full max-w-6xl p-8 rounded-2xl shadow-md bg-white mx-auto">
  //         <h2 className="text-2xl font-bold text-[#00004d] mb-6 text-left">
  //           QR Code Scanner
  //         </h2>

  //         <div className="flex flex-col lg:flex-row gap-8">
  //           <div className="flex-1 flex flex-col items-center">
  //             <div className="relative w-full max-w-sm border-2 border-dashed border-[#000052] rounded-xl p-4 bg-[#f5f6fb] shadow-inner">
  //               <p className="absolute -top-4 left-4 text-xs font-medium bg-white px-2 py-0.5 rounded shadow text-[#000052]">
  //                 Scan Live QR
  //               </p>

  //               <div className="w-full h-56 rounded-md overflow-hidden relative">
  //                 {!scanning && (
  //                   <div className="absolute inset-0 flex items-center justify-center">
  //                     <ScanLine className="w-40 h-40 text-[#00004d] opacity-90" />
  //                   </div>
  //                 )}
  //                 <div id="qr-reader" ref={qrRef} className="w-full h-full" />
  //               </div>
  //             </div>

  //             <div className="mt-6 w-full flex justify-center">
  //               {!scanning ? (
  //                 <Button
  //                   onClick={startScanner}
  //                   className="bg-[#000066] hover:bg-[#000080] text-white text-sm flex items-center gap-2"
  //                 >
  //                   <Play className="w-4 h-4" />
  //                   Start Scanner
  //                 </Button>
  //               ) : (
  //                 <Button
  //                   onClick={stopScanner}
  //                   className="bg-red-600 hover:bg-red-700 text-white text-sm flex items-center gap-2"
  //                 >
  //                   <Square className="w-4 h-4" />
  //                   Stop Scanner
  //                 </Button>
  //               )}
  //             </div>
  //           </div>

  //           <div className="flex-1 bg-white/50 backdrop-blur-lg border border-gray-200 rounded-xl p-6 shadow-sm max-h-[calc(50vh-100px)] overflow-y-auto">
  //             <div className="flex items-center gap-3 mb-4">
  //               <QrCode className="w-6 h-6 text-[#00004d]" />
  //               <h3 className="text-lg font-semibold text-[#00004d]">
  //                 Scan QR to Pay
  //               </h3>
  //             </div>

  //             <p className="text-sm text-gray-600 mb-4">How to Pay</p>
  //             <ul className="space-y-3 text-gray-700 text-sm">
  //               <li className="flex items-start gap-2">
  //                 <span className="text-[#000066] font-semibold">•</span>
  //                 Ask the vendor to show their payment QR code and scan it using
  //                 the scanner.
  //               </li>
  //               <li className="flex items-start gap-2">
  //                 <span className="text-[#000066] font-semibold">•</span>
  //                 Confirm the amount and vendor details.
  //               </li>
  //               <li className="flex items-start gap-2">
  //                 <span className="text-[#000066] font-semibold">•</span>
  //                 Complete your payment.
  //               </li>
  //             </ul>
  //           </div>
  //         </div>

  //         {/* Payment Dialog */}
  //         <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
  //           <DialogContent>
  //             <DialogHeader>
  //               <DialogTitle>Complete Payment</DialogTitle>
  //             </DialogHeader>

  //             <div className="bg-[#f4f6ff] border text-sm text-gray-700 px-4 py-2 rounded mb-4 space-y-1">
  //               {parsedData.name && (
  //                 <p>
  //                   <span className="font-medium text-[#00004d]">Name:</span>{" "}
  //                   {parsedData.name}
  //                 </p>
  //               )}
  //               {parsedData.store && (
  //                 <p>
  //                   <span className="font-medium text-[#00004d]">Store:</span>{" "}
  //                   {parsedData.store}
  //                 </p>
  //               )}
  //               <p>
  //                 <span className="font-medium text-[#00004d]">QR Code:</span>{" "}
  //                 {result.length > 50 ? result.slice(0, 50) + "..." : result}
  //               </p>
  //             </div>

  //             <div className="flex flex-col gap-4">
  //               <label className="text-sm text-gray-600">Amount (₹)</label>
  //               <Input
  //                 type="number"
  //                 value={amount}
  //                 onChange={(e) => setAmount(e.target.value)}
  //                 placeholder="₹ Enter amount"
  //               />
  //             </div>

  //             <DialogFooter className="mt-4 flex justify-end">
  //               <Button
  //                 onClick={handlePaymentSubmit}
  //                 className="bg-[#000066] text-white"
  //               >
  //                 Pay Now
  //               </Button>
  //             </DialogFooter>
  //           </DialogContent>
  //         </Dialog>

  //         {/* Success Dialog */}
  //         <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
  //           <DialogContent>
  //             <DialogHeader>
  //               <DialogTitle>Payment Successful</DialogTitle>
  //             </DialogHeader>

  //             <div className="bg-[#e6ffef] border text-sm text-green-700 px-4 py-2 rounded mb-3 space-y-1">
  //               {parsedData.name && (
  //                 <p>
  //                   <span className="font-medium text-green-900">Name:</span>{" "}
  //                   {parsedData.name}
  //                 </p>
  //               )}
  //               {parsedData.store && (
  //                 <p>
  //                   <span className="font-medium text-green-900">Store:</span>{" "}
  //                   {parsedData.store}
  //                 </p>
  //               )}
  //               <p>
  //                 <span className="font-medium text-green-900">QR Code:</span>{" "}
  //                 {result.length > 50 ? result.slice(0, 50) + "..." : result}
  //               </p>
  //             </div>

  //             <p className="text-green-600 text-center font-semibold">
  //               ₹{amount} paid successfully!
  //             </p>

  //             <DialogFooter className="mt-4 flex justify-end">
  //               <Button
  //                 onClick={() => setShowSuccessDialog(false)}
  //                 variant="outline"
  //               >
  //                 Done
  //               </Button>
  //             </DialogFooter>
  //           </DialogContent>
  //         </Dialog>
  //       </Card>

  //       <Card className="mt-10 w-full max-w-6xl p-8 rounded-2xl shadow-md bg-white mx-auto">
  //         <FoodStalls handlePayNow={handleManualPayNow} />
  //       </Card>
  //     </>
  //   );
  // };

  // export default QrScanner;


//   "use client";

// import React, { useEffect, useRef, useState } from "react";
// import { Html5Qrcode } from "html5-qrcode";
// import { Button } from "@/components/ui/button";
// import { QrCode, Play, Square, ScanLine } from "lucide-react";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Card } from "@/components/ui/card";
// import FoodStalls from "@/Modules/User/pages/UserDasboardpage/Foodstallsection";
// import { useAuth } from "@/context/AuthContext";
// import axios from "axios";
// import { toast, ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

// const QrScanner = () => {
//   const qrRef = useRef(null);
//   const html5QrCodeRef = useRef(null);
//   const [scanning, setScanning] = useState(false);
//   const [result, setResult] = useState("");
//   const [parsedData, setParsedData] = useState({ name: "", store: "", user_id: "" });
//   const [showPaymentDialog, setShowPaymentDialog] = useState(false);
//   const [showSuccessDialog, setShowSuccessDialog] = useState(false);
//   const [amount, setAmount] = useState("");
//   const [manualQrCode, setManualQrCode] = useState("");
//   const { user } = useAuth();

//   const startScanner = async () => {
//     const html5QrCode = new Html5Qrcode("qr-reader");
//     html5QrCodeRef.current = html5QrCode;

//     try {
//       await html5QrCode.start(
//         { facingMode: "environment" },
//         { fps: 10, qrbox: { width: 300, height: 150 } },
//         async (decodedText) => {
//           setResult(decodedText);
//           await fetchRestaurantDetails(decodedText);
//           setShowPaymentDialog(true);
//           stopScanner();
//         },
//         (error) => {
//           console.warn("QR scan error:", error);
//         }
//       );
//       setScanning(true);
//     } catch (err) {
//       console.error("Camera start failed:", err);
//       toast.error("Failed to start camera. Please use manual QR code entry.", {
//         position: "top-right",
//         autoClose: 5000,
//         hideProgressBar: false,
//         closeOnClick: true,
//         pauseOnHover: true,
//         draggable: true,
//         theme: "light",
//       });
//     }
//   };

//   const stopScanner = async () => {
//     if (html5QrCodeRef.current) {
//       try {
//         await html5QrCodeRef.current.stop();
//         await html5QrCodeRef.current.clear();
//         setScanning(false);
//       } catch (err) {
//         console.error("Stop failed:", err);
//       }
//     }
//   };

//   const fetchRestaurantDetails = async (qrCode) => {
//     try {
//       const response = await axios.get(
//         `${import.meta.env.VITE_BASE_URL}/restaurants/fetch-by-qr`,
//         { params: { qr_code: qrCode }, withCredentials: true }
//       );
//       const { data } = response.data;
//       setParsedData({
//         name: data.user_id?.name || "",
//         store: data.restaurant_name || "",
//         user_id: data.user_id?._id || "",
//       });
//     } catch (err) {
//       console.error("Failed to fetch restaurant details:", err);
//       setParsedData({ name: "", store: "", user_id: "" });
//       if (err.response?.status === 404) {
//         toast.error("Restaurant not found for this QR code.", {
//           position: "top-right",
//           autoClose: 5000,
//           hideProgressBar: false,
//           closeOnClick: true,
//           pauseOnHover: true,
//           draggable: true,
//           theme: "light",
//         });
//       } else {
//         toast.error("Failed to fetch restaurant details. Please try again.", {
//           position: "top-right",
//           autoClose: 5000,
//           hideProgressBar: false,
//           closeOnClick: true,
//           pauseOnHover: true,
//           draggable: true,
//           theme: "light",
//         });
//       }
//     }
//   };

//   const handleManualQrSubmit = async () => {
//     if (manualQrCode.trim() === "") {
//       toast.error("Please enter a valid QR code.", {
//         position: "top-right",
//         autoClose: 5000,
//         hideProgressBar: false,
//         closeOnClick: true,
//         pauseOnHover: true,
//         draggable: true,
//         theme: "light",
//       });
//       return;
//     }
//     setResult(manualQrCode);
//     await fetchRestaurantDetails(manualQrCode);
//     setShowPaymentDialog(true);
//   };

//   const handlePaymentSubmit = async () => {
//     if (amount.trim() === "" || parseFloat(amount) <= 0) {
//       toast.error("Please enter a valid amount.", {
//         position: "top-right",
//         autoClose: 5000,
//         hideProgressBar: false,
//         closeOnClick: true,
//         pauseOnHover: true,
//         draggable: true,
//         theme: "light",
//       });
//       return;
//     }

//     try {
//       // Check customer balance
//       const balanceResponse = await axios.get(
//         `${import.meta.env.VITE_BASE_URL}/user-balances/fetch-balance-by-id/${user._id}`,
//         { withCredentials: true }
//       );
//       const currentBalance = parseFloat(balanceResponse.data.data.balance);

//       if (currentBalance < parseFloat(amount)) {
//         toast.error("Insufficient balance.", {
//           position: "top-right",
//           autoClose: 5000,
//           hideProgressBar: false,
//           closeOnClick: true,
//           pauseOnHover: true,
//           draggable: true,
//           theme: "light",
//         });
//         return;
//       }

//       // Create transaction
//       const transactionResponse = await axios.post(
//         `${import.meta.env.VITE_BASE_URL}/transactions/create-transaction`,
//         {
//           sender_id: user._id,
//           receiver_id: parsedData.user_id,
//           amount: parseFloat(amount),
//           transaction_type: "Transfer",
//           payment_method: "Mess bill",
//           status: "Success",
//           remarks: `Payment to ${parsedData.store}`,
//         },
//         { withCredentials: true }
//       );

//       // Update sender balance
//       await axios.post(
//         `${import.meta.env.VITE_BASE_URL}/user-balances/create-or-update-balance`,
//         {
//           user_id: user._id,
//           balance: (currentBalance - parseFloat(amount)).toFixed(2),
//         },
//         { withCredentials: true }
//       );

//       // Update receiver balance
//       const receiverBalanceResponse = await axios.get(
//         `${import.meta.env.VITE_BASE_URL}/user-balances/fetch-balance-by-id/${parsedData.user_id}`,
//         { withCredentials: true }
//       );
//       const receiverCurrentBalance = parseFloat(
//         receiverBalanceResponse.data.data.balance || "0.00"
//       );
//       await axios.post(
//         `${import.meta.env.VITE_BASE_URL}/user-balances/create-or-update-balance`,
//         {
//           user_id: parsedData.user_id,
//           balance: (receiverCurrentBalance + parseFloat(amount)).toFixed(2),
//         },
//         { withCredentials: true }
//       );

//       setShowPaymentDialog(false);
//       setShowSuccessDialog(true);
//       toast.success(`Payment of ₹${amount} to ${parsedData.store} successful!`, {
//         position: "top-right",
//         autoClose: 5000,
//         hideProgressBar: false,
//         closeOnClick: true,
//         pauseOnHover: true,
//         draggable: true,
//         theme: "light",
//       });
//     } catch (err) {
//       console.error("Payment processing failed:", err);
//       toast.error("Failed to process payment. Please try again.", {
//         position: "top-right",
//         autoClose: 5000,
//         hideProgressBar: false,
//         closeOnClick: true,
//         pauseOnHover: true,
//         draggable: true,
//         theme: "light",
//       });
//     }
//   };

//   const handleManualPayNow = async ({ name, store, result, user_id }) => {
//     setParsedData({ name, store, user_id });
//     setResult(result);
//     setShowPaymentDialog(true);
//   };

//   useEffect(() => {
//     return () => stopScanner();
//   }, []);

//   return (
//     <>
//       <ToastContainer
//         position="top-right"
//         autoClose={5000}
//         hideProgressBar={false}
//         newestOnTop={false}
//         closeOnClick
//         rtl={false}
//         pauseOnFocusLoss
//         draggable
//         pauseOnHover
//         theme="light"
//         toastStyle={{
//           backgroundColor: "#fff",
//           color: "#00004d",
//           border: "1px solid #e5e7eb",
//           boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
//         }}
//         progressStyle={{
//           background: "#000066",
//         }}
//       />
//       <Card className="mt-10 w-full max-w-6xl p-8 rounded-2xl shadow-md bg-white mx-auto">
//         <h2 className="text-2xl font-bold text-[#00004d] mb-6 text-left">
//           QR Code Scanner
//         </h2>

//         <div className="flex flex-col lg:flex-row gap-8">
//           <div className="flex-1 flex flex-col items-center">
//             <div className="relative w-full max-w-sm border-2 border-dashed border-[#000052] rounded-xl p-4 bg-[#f5f6fb]">
//               <p className="absolute -top-4 left-4 text-xs font-medium bg-white px-2 py-0.5 rounded shadow text-[#000052]">
//                 Scan Live QR
//               </p>

//               <div className="w-full h-56 rounded-md overflow-hidden relative">
//                 {!scanning && (
//                   <div className="absolute inset-0 flex items-center justify-center">
//                     <ScanLine className="w-40 h-40 text-[#00004d] opacity-90" />
//                   </div>
//                 )}
//                 <div id="qr-reader" ref={qrRef} className="w-full h-full" />
//               </div>
//             </div>

//             <div className="mt-6 w-full flex justify-center gap-4">
//               {!scanning ? (
//                 <Button
//                   onClick={startScanner}
//                   className="bg-[#000066] hover:bg-[#000080] text-white text-sm flex items-center gap-2"
//                 >
//                   <Play className="w-4 h-4" />
//                   Start Scanner
//                 </Button>
//               ) : (
//                 <Button
//                   onClick={stopScanner}
//                   className="bg-red-600 hover:bg-red-700 text-white text-sm flex items-center gap-2"
//                 >
//                   <Square className="w-4 h-4" />
//                   Stop Scanner
//                 </Button>
//               )}
//             </div>

//             <div className="mt-4 w-full max-w-sm">
//               <p className="text-sm text-gray-600 mb-2">Or enter QR code manually:</p>
//               <div className="flex gap-2">
//                 <Input
//                   type="text"
//                   value={manualQrCode}
//                   onChange={(e) => setManualQrCode(e.target.value)}
//                   placeholder="Enter restaurant QR code"
//                   className="flex-1"
//                 />
//                 <Button
//                   onClick={handleManualQrSubmit}
//                   className="bg-[#000066] hover:bg-[#000080] text-white text-sm"
//                 >
//                   Submit
//                 </Button>
//               </div>
//             </div>
//           </div>

//           <div className="flex-1 bg-white/50 backdrop-blur-lg border border-gray-200 rounded-xl p-6 shadow-sm max-h-[calc(50vh-100px)] overflow-y-auto">
//             <div className="flex items-center gap-3 mb-4">
//               <QrCode className="w-6 h-6 text-[#00004d]" />
//               <h3 className="text-lg font-semibold text-[#00004d]">
//                 Scan QR to Pay
//               </h3>
//             </div>

//             <p className="text-sm text-gray-600 mb-4">How to Pay</p>
//             <ul className="space-y-3 text-gray-700 text-sm">
//               <li className="flex items-start gap-2">
//                 <span className="text-[#000066] font-semibold">•</span>
//                 Ask the vendor to show their payment QR code or provide their QR code ID.
//               </li>
//               <li className="flex items-start gap-2">
//                 <span className="text-[#000066] font-semibold">•</span>
//                 Scan the QR code or enter it manually, then confirm the amount and vendor details.
//               </li>
//               <li className="flex items-start gap-2">
//                 <span className="text-[#000066] font-semibold">•</span>
//                 Complete your payment.
//               </li>
//             </ul>
//           </div>
//         </div>

//         {/* Payment Dialog */}
//         <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
//           <DialogContent>
//             <DialogHeader>
//               <DialogTitle>Complete Payment</DialogTitle>
//               <DialogDescription>
//                 Enter the amount to pay to the selected restaurant.
//               </DialogDescription>
//             </DialogHeader>

//             <div className="bg-[#f4f6ff] border text-sm text-gray-700 px-4 py-2 rounded mb-4 space-y-1">
//               {parsedData.name && (
//                 <p>
//                   <span className="font-medium text-[#00004d]">Name:</span>{" "}
//                   {parsedData.name}
//                 </p>
//               )}
//               {parsedData.store && (
//                 <p>
//                   <span className="font-medium text-[#00004d]">Store:</span>{" "}
//                   {parsedData.store}
//                 </p>
//               )}
//               <p>
//                 <span className="font-medium text-[#00004d]">QR Code:</span>{" "}
//                 {result.length > 50 ? result.slice(0, 50) + "..." : result}
//               </p>
//             </div>

//             <div className="flex flex-col gap-4">
//               <label className="text-sm text-gray-600">Amount (₹)</label>
//               <Input
//                 type="number"
//                 value={amount}
//                 onChange={(e) => setAmount(e.target.value)}
//                 placeholder="₹ Enter amount"
//               />
//             </div>

//             <DialogFooter className="mt-4 flex justify-end">
//               <Button
//                 onClick={handlePaymentSubmit}
//                 className="bg-[#000066] text-white"
//                 disabled={!parsedData.user_id}
//               >
//                 Pay Now
//               </Button>
//             </DialogFooter>
//           </DialogContent>
//         </Dialog>

//         {/* Success Dialog */}
//         <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
//           <DialogContent>
//             <DialogHeader>
//               <DialogTitle>Payment Successful</DialogTitle>
//               <DialogDescription>
//                 Your payment to the restaurant has been processed successfully.
//               </DialogDescription>
//             </DialogHeader>

//             <div className="bg-[#e6ffef] border text-sm text-green-700 px-4 py-2 rounded mb-3 space-y-1">
//               {parsedData.name && (
//                 <p>
//                   <span className="font-medium text-green-900">Name:</span>{" "}
//                   {parsedData.name}
//                 </p>
//               )}
//               {parsedData.store && (
//                 <p>
//                   <span className="font-medium text-green-900">Store:</span>{" "}
//                   {parsedData.store}
//                 </p>
//               )}
//               <p>
//                 <span className="font-medium text-green-900">QR Code:</span>{" "}
//                 {result.length > 50 ? result.slice(0, 50) + "..." : result}
//               </p>
//             </div>

//             <p className="text-green-600 text-center font-semibold">
//               ₹{amount} paid successfully!
//             </p>

//             <DialogFooter className="mt-4 flex justify-end">
//               <Button
//                 onClick={() => setShowSuccessDialog(false)}
//                 variant="outline"
//               >
//                 Done
//               </Button>
//             </DialogFooter>
//           </DialogContent>
//         </Dialog>
//       </Card>

//       <Card className="mt-10 w-full max-w-6xl p-8 rounded-2xl shadow-md bg-white mx-auto">
//         <FoodStalls handlePayNow={handleManualPayNow} />
//       </Card>
//     </>
//   );
// };

// export default QrScanner;






// "use client";

// import React, { useEffect, useRef, useState } from "react";
// import { Html5Qrcode } from "html5-qrcode";
// import { Button } from "@/components/ui/button";
// import { QrCode, Play, Square, ScanLine } from "lucide-react";
// import {
//   Dialog,
//   DialogContent,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Card } from "@/components/ui/card";
// import FoodStalls from "@/Modules/User/pages/UserDasboardpage/Foodstallsection";
// import { useAuth } from "@/context/AuthContext";
// import axios from "axios";
// import { toast } from "react-toastify";

// const QrScanner = () => {
//   const qrRef = useRef(null);
//   const html5QrCodeRef = useRef(null);
//   const [scanning, setScanning] = useState(false);
//   const [result, setResult] = useState("");
//   const [parsedData, setParsedData] = useState({ name: "", store: "", restaurant_id: "" });
//   const [showPaymentDialog, setShowPaymentDialog] = useState(false);
//   const [showSuccessDialog, setShowSuccessDialog] = useState(false);
//   const [amount, setAmount] = useState("");
//   const [manualQrCode, setManualQrCode] = useState("");
//   const { user } = useAuth();

//   const startScanner = async () => {
//     const html5QrCode = new Html5Qrcode("qr-reader");
//     html5QrCodeRef.current = html5QrCode;

//     try {
//       await html5QrCode.start(
//         { facingMode: "environment" },
//         { fps: 10, qrbox: { width: 300, height: 150 } },
//         async (decodedText) => {
//           await validateQrCode(decodedText);
//           stopScanner();
//         },
//         (error) => {
//           console.warn("QR scan error:", error);
//         }
//       );
//       setScanning(true);
//     } catch (err) {
//       console.error("Camera start failed:", err);
//       toast.error("Failed to start camera");
//     }
//   };

//   const stopScanner = async () => {
//     if (html5QrCodeRef.current) {
//       try {
//         await html5QrCodeRef.current.stop();
//         await html5QrCodeRef.current.clear();
//         setScanning(false);
//       } catch (err) {
//         console.error("Stop failed:", err);
//       }
//     }
//   };

//   const validateQrCode = async (qrCode) => {
//     try {
//       const response = await axios.get(
//         `${import.meta.env.VITE_BASE_URL}/restaurants/fetch-by-qr`,
//         { params: { qr_code: qrCode }, withCredentials: true }
//       );
//       const restaurant = response.data.data;
//       setResult(qrCode);
//       setParsedData({
//         name: restaurant.user_id.name,
//         store: restaurant.restaurant_name,
//         restaurant_id: restaurant.user_id._id,
//       });
//       setShowPaymentDialog(true);
//     } catch (err) {
//       toast.error("Invalid QR code or restaurant not found");
//     }
//   };

//   const handleManualQrSubmit = async () => {
//     if (manualQrCode.trim()) {
//       await validateQrCode(manualQrCode);
//     } else {
//       toast.error("Please enter a QR code");
//     }
//   };

//   const handlePaymentSubmit = async () => {
//     if (amount.trim() === "" || parseFloat(amount) <= 0) {
//       toast.error("Please enter a valid amount");
//       return;
//     }

//     try {
//       // Check customer balance
//       const balanceResponse = await axios.get(
//         `${import.meta.env.VITE_BASE_URL}/user-balance/fetch-balance-by-id/${user._id}`,
//         { withCredentials: true }
//       );
//       const currentBalance = parseFloat(balanceResponse.data.data.balance);
//       if (currentBalance < parseFloat(amount)) {
//         toast.error("Insufficient balance");
//         return;
//       }

//       // Create transaction
//       const transactionResponse = await axios.post(
//         `${import.meta.env.VITE_BASE_URL}/transactions/create-transaction`,
//         {
//           sender_id: user._id,
//           receiver_id: parsedData.restaurant_id,
//           amount: parseFloat(amount).toFixed(2),
//           transaction_type: "Transfer",
//           payment_method: "Gpay",
//           status: "Success",
//           remarks: `Payment to ${parsedData.store}`,
//         },
//         { withCredentials: true }
//       );

//       // Update customer balance
//       await axios.post(
//         `${import.meta.env.VITE_BASE_URL}/user-balance/create-or-update-balance`,
//         {
//           user_id: user._id,
//           balance: (currentBalance - parseFloat(amount)).toFixed(2),
//         },
//         { withCredentials: true }
//       );

//       // Update restaurant balance
//       const restaurantBalanceResponse = await axios.get(
//         `${import.meta.env.VITE_BASE_URL}/user-balance/fetch-balance-by-id/${parsedData.restaurant_id}`,
//         { withCredentials: true }
//       );
//       const restaurantCurrentBalance = parseFloat(restaurantBalanceResponse.data.data.balance || "0.00");
//       await axios.post(
//         `${import.meta.env.VITE_BASE_URL}/user-balance/create-or-update-balance`,
//         {
//           user_id: parsedData.restaurant_id,
//           balance: (restaurantCurrentBalance + parseFloat(amount)).toFixed(2),
//         },
//         { withCredentials: true }
//       );

//       setShowPaymentDialog(false);
//       setShowSuccessDialog(true);
//       setManualQrCode("");
//       toast.success("Payment completed successfully!");
//     } catch (err) {
//       console.error("Payment failed:", err);
//       toast.error("Payment failed. Please try again.");
//     }
//   };

//   const handleManualPayNow = ({ name, store, result, restaurant_id }) => {
//     setParsedData({ name, store, restaurant_id });
//     setResult(result);
//     setShowPaymentDialog(true);
//   };

//   useEffect(() => {
//     return () => stopScanner();
//   }, []);

//   return (
//     <>
//       <Card className="mt-10 w-full max-w-6xl p-8 rounded-2xl shadow-md bg-white mx-auto">
//         <h2 className="text-2xl font-bold text-[#00004d] mb-6 text-left">
//           QR Code Scanner
//         </h2>

//         <div className="flex flex-col lg:flex-row gap-8">
//           <div className="flex-1 flex flex-col items-center">
//             <div className="relative w-full max-w-sm border-2 border-dashed border-[#000052] rounded-xl p-4 bg-[#f5f6fb] shadow-inner">
//               <p className="absolute -top-4 left-4 text-xs font-medium bg-white px-2 py-0.5 rounded shadow text-[#000052]">
//                 Scan or Enter QR
//               </p>

//               <div className="w-full h-56 rounded-md overflow-hidden relative">
//                 {!scanning && (
//                   <div className="absolute inset-0 flex items-center justify-center">
//                     <ScanLine className="w-40 h-40 text-[#00004d] opacity-90" />
//                   </div>
//                 )}
//                 <div id="qr-reader" ref={qrRef} className="w-full h-full" />
//               </div>

//               <div className="mt-4 w-full">
//                 <Input
//                   type="text"
//                   value={manualQrCode}
//                   onChange={(e) => setManualQrCode(e.target.value)}
//                   placeholder="Enter QR Code"
//                   className="text-sm mb-2"
//                 />
//                 <Button
//                   onClick={handleManualQrSubmit}
//                   className="w-full bg-[#000066] hover:bg-[#000080] text-white text-sm"
//                 >
//                   Validate QR Code
//                 </Button>
//               </div>
//             </div>

//             <div className="mt-6 w-full flex justify-center">
//               {!scanning ? (
//                 <Button
//                   onClick={startScanner}
//                   className="bg-[#000066] hover:bg-[#000080] text-white text-sm flex items-center gap-2"
//                 >
//                   <Play className="w-4 h-4" />
//                   Start Scanner
//                 </Button>
//               ) : (
//                 <Button
//                   onClick={stopScanner}
//                   className="bg-red-600 hover:bg-red-700 text-white text-sm flex items-center gap-2"
//                 >
//                   <Square className="w-4 h-4" />
//                   Stop Scanner
//                 </Button>
//               )}
//             </div>
//           </div>

//           <div className="flex-1 bg-white/50 backdrop-blur-lg border border-gray-200 rounded-xl p-6 shadow-sm max-h-[calc(50vh-100px)] overflow-y-auto">
//             <div className="flex items-center gap-3 mb-4">
//               <QrCode className="w-6 h-6 text-[#00004d]" />
//               <h3 className="text-lg font-semibold text-[#00004d]">
//                 Scan QR to Pay
//               </h3>
//             </div>

//             <p className="text-sm text-gray-600 mb-4">How to Pay</p>
//             <ul className="space-y-3 text-gray-700 text-sm">
//               <li className="flex items-start gap-2">
//                 <span className="text-[#000066] font-semibold">•</span>
//                 Scan the vendor's QR code or enter it manually.
//               </li>
//               <li className="flex items-start gap-2">
//                 <span className="text-[#000066] font-semibold">•</span>
//                 Confirm the amount and vendor details.
//               </li>
//               <li className="flex items-start gap-2">
//                 <span className="text-[#000066] font-semibold">•</span>
//                 Complete your payment.
//               </li>
//             </ul>
//           </div>
//         </div>

//         {/* Payment Dialog */}
//         <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
//           <DialogContent>
//             <DialogHeader>
//               <DialogTitle>Complete Payment</DialogTitle>
//             </DialogHeader>

//             <div className="bg-[#f4f6ff] border text-sm text-gray-700 px-4 py-2 rounded mb-4 space-y-1">
//               {parsedData.name && (
//                 <p>
//                   <span className="font-medium text-[#00004d]">Name:</span>{" "}
//                   {parsedData.name}
//                 </p>
//               )}
//               {parsedData.store && (
//                 <p>
//                   <span className="font-medium text-[#00004d]">Store:</span>{" "}
//                   {parsedData.store}
//                 </p>
//               )}
//               <p>
//                 <span className="font-medium text-[#00004d]">QR Code:</span>{" "}
//                 {result.length > 50 ? result.slice(0, 50) + "..." : result}
//               </p>
//             </div>

//             <div className="flex flex-col gap-4">
//               <label className="text-sm text-gray-600">Amount (₹)</label>
//               <Input
//                 type="number"
//                 value={amount}
//                 onChange={(e) => setAmount(e.target.value)}
//                 placeholder="₹ Enter amount"
//               />
//             </div>

//             <DialogFooter className="mt-4 flex justify-end">
//               <Button
//                 onClick={handlePaymentSubmit}
//                 className="bg-[#000066] text-white"
//               >
//                 Pay Now
//               </Button>
//             </DialogFooter>
//           </DialogContent>
//         </Dialog>

//         {/* Success Dialog */}
//         <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
//           <DialogContent>
//             <DialogHeader>
//               <DialogTitle>Payment Successful</DialogTitle>
//             </DialogHeader>

//             <div className="bg-[#e6ffef] border text-sm text-green-700 px-4 py-2 rounded mb-3 space-y-1">
//               {parsedData.name && (
//                 <p>
//                   <span className="font-medium text-green-900">Name:</span>{" "}
//                   {parsedData.name}
//                 </p>
//               )}
//               {parsedData.store && (
//                 <p>
//                   <span className="font-medium text-green-900">Store:</span>{" "}
//                   {parsedData.store}
//                 </p>
//               )}
//               <p>
//                 <span className="font-medium text-green-900">QR Code:</span>{" "}
//                 {result.length > 50 ? result.slice(0, 50) + "..." : result}
//               </p>
//             </div>

//             <p className="text-green-600 text-center font-semibold">
//               ₹{amount} paid successfully!
//             </p>

//             <DialogFooter className="mt-4 flex justify-end">
//               <Button
//                 onClick={() => setShowSuccessDialog(false)}
//                 variant="outline"
//               >
//                 Done
//               </Button>
//             </DialogFooter>
//           </DialogContent>
//         </Dialog>
//       </Card>

//       <Card className="mt-10 w-full max-w-6xl p-8 rounded-2xl shadow-md bg-white mx-auto">
//         <FoodStalls handlePayNow={handleManualPayNow} />
//       </Card>
//     </>
//   );
// };

// export default QrScanner;
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { QrCode, Play, Square, ScanLine } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import FoodStalls from "@/Modules/User/pages/UserDasboardpage/Foodstallsection";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { toast } from "react-toastify";

const QrScanner = () => {
  const qrRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState("");
  const [parsedData, setParsedData] = useState({ name: "", store: "", restaurant_id: "" });
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [amount, setAmount] = useState("");
  const [manualQrCode, setManualQrCode] = useState("");
  const { user } = useAuth();

  const startScanner = async () => {
    const html5QrCode = new Html5Qrcode("qr-reader");
    html5QrCodeRef.current = html5QrCode;

    try {
      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 300, height: 150 } },
        async (decodedText) => {
          await validateQrCode(decodedText);
          stopScanner();
        },
        (error) => {
          console.warn("QR scan error:", error);
        }
      );
      setScanning(true);
    } catch (err) {
      console.error("Camera start failed:", err);
      toast.error("Failed to start camera");
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        await html5QrCodeRef.current.clear();
        setScanning(false);
      } catch (err) {
        console.error("Stop failed:", err);
      }
    }
  };

  const validateQrCode = async (qrCode) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/restaurants/fetch-by-qr`,
        { params: { qr_code: qrCode }, withCredentials: true }
      );
      const restaurant = response.data.data;
      setResult(qrCode);
      setParsedData({
        name: restaurant.user_id.name,
        store: restaurant.restaurant_name,
        restaurant_id: restaurant.user_id._id,
      });
      setShowPaymentDialog(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid QR code or restaurant not found");
    }
  };

  const handleManualQrSubmit = async () => {
    if (manualQrCode.trim()) {
      await validateQrCode(manualQrCode);
    } else {
      toast.error("Please enter a QR code");
    }
  };

  const handlePaymentSubmit = async () => {
    if (!user || !user._id) {
      toast.error("Please log in to make a payment");
      return;
    }

    if (amount.trim() === "" || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!parsedData.restaurant_id) {
      toast.error("Invalid restaurant selected");
      return;
    }

    const paymentAmount = parseFloat(amount);
    let transactionId = null;

    try {
      // Validate restaurant user
      const restaurantUserResponse = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/users/fetch-user-by-id/${parsedData.restaurant_id}`,
        { withCredentials: true }
      );
      const restaurantUser = restaurantUserResponse.data.data;
      if (!restaurantUser || restaurantUser.role_id?.role_id !== "role-4") {
        throw new Error("Receiver is not a valid restaurant user");
      }

      // Check customer balance
      const balanceResponse = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/user-balance/fetch-balance-by-id/${user._id}`,
        { withCredentials: true }
      );
      const currentBalance = parseFloat(balanceResponse.data.data.balance || "0.00");
      if (currentBalance < paymentAmount) {
        toast.error("Insufficient balance");
        return;
      }

      // Create transaction
      const transactionResponse = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/transactions/create-transaction`,
        {
          sender_id: user._id,
          receiver_id: parsedData.restaurant_id,
          amount: paymentAmount.toFixed(2),
          transaction_type: "Transfer",
          payment_method: "Gpay",
          status: "Pending",
          remarks: `Payment to ${parsedData.store}`,
        },
        { withCredentials: true }
      );
      transactionId = transactionResponse.data.data._id;
      console.log("Transaction created:", transactionId);

      // Update customer balance
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/user-balance/create-or-update-balance`,
        {
          user_id: user._id,
          balance: (currentBalance - paymentAmount).toFixed(2),
        },
        { withCredentials: true }
      );
      console.log("Customer balance updated:", user._id, currentBalance - paymentAmount);

      // Ensure restaurant balance record exists
      let restaurantCurrentBalance = 0.00;
      try {
        const restaurantBalanceResponse = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/user-balance/fetch-balance-by-id/${parsedData.restaurant_id}`,
          { withCredentials: true }
        );
        restaurantCurrentBalance = parseFloat(restaurantBalanceResponse.data.data.balance || "0.00");
      } catch (err) {
        // Create balance record if it doesn't exist
        await axios.post(
          `${import.meta.env.VITE_BASE_URL}/user-balance/create-or-update-balance`,
          {
            user_id: parsedData.restaurant_id,
            balance: "0.00",
          },
          { withCredentials: true }
        );
        console.log("Created initial balance for restaurant:", parsedData.restaurant_id);
      }

      // Update restaurant balance
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/user-balance/create-or-update-balance`,
        {
          user_id: parsedData.restaurant_id,
          balance: (restaurantCurrentBalance + paymentAmount).toFixed(2),
        },
        { withCredentials: true }
      );
      console.log("Restaurant balance updated:", parsedData.restaurant_id, restaurantCurrentBalance + paymentAmount);

      // Update transaction status to Success
      await axios.put(
        `${import.meta.env.VITE_BASE_URL}/transactions/update-transaction/${transactionId}`,
        { status: "Success" },
        { withCredentials: true }
      );
      console.log("Transaction status updated to Success:", transactionId);

      setShowPaymentDialog(false);
      setShowSuccessDialog(true);
      setManualQrCode("");
      setAmount("");
      toast.success("Payment completed successfully!");
    } catch (err) {
      console.error("Payment failed:", err.response?.data || err.message);

      // Roll back if transaction was created
      if (transactionId) {
        try {
          // Update transaction status to Failed
          await axios.put(
            `${import.meta.env.VITE_BASE_URL}/transactions/update-transaction/${transactionId}`,
            { status: "Failed" },
            { withCredentials: true }
          );
          console.log("Transaction marked as Failed:", transactionId);

          // Restore customer balance
          const balanceResponse = await axios.get(
            `${import.meta.env.VITE_BASE_URL}/user-balance/fetch-balance-by-id/${user._id}`,
            { withCredentials: true }
          );
          const currentBalance = parseFloat(balanceResponse.data.data.balance || "0.00");
          await axios.post(
            `${import.meta.env.VITE_BASE_URL}/user-balance/create-or-update-balance`,
            {
              user_id: user._id,
              balance: (currentBalance + paymentAmount).toFixed(2),
            },
            { withCredentials: true }
          );
          console.log("Customer balance restored:", user._id, currentBalance + paymentAmount);
        } catch (rollbackErr) {
          console.error("Rollback failed:", rollbackErr);
          toast.error("Payment failed and rollback incomplete. Please contact support.");
          return;
        }
      }

      toast.error(err.response?.data?.message || "Payment failed. Please try again.");
    }
  };

  const handleManualPayNow = ({ name, store, result, restaurant_id }) => {
    setParsedData({ name, store, restaurant_id });
    setResult(result);
    setShowPaymentDialog(true);
  };

  useEffect(() => {
    return () => stopScanner();
  }, []);

  return (
    <>
      <Card className="mt-10 w-full max-w-6xl p-8 rounded-2xl shadow-md bg-white mx-auto">
        <h2 className="text-2xl font-bold text-[#00004d] mb-6 text-left">
          QR Code Scanner
        </h2>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 flex flex-col items-center">
            <div className="relative w-full max-w-sm border-2 border-dashed border-[#000052] rounded-xl p-4 bg-[#f5f6fb] shadow-inner">
              <p className="absolute -top-4 left-4 text-xs font-medium bg-white px-2 py-0.5 rounded shadow text-[#000052]">
                Scan or Enter QR
              </p>

              <div className="w-full h-56 rounded-md overflow-hidden relative">
                {!scanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ScanLine className="w-40 h-40 text-[#00004d] opacity-90" />
                  </div>
                )}
                <div id="qr-reader" ref={qrRef} className="w-full h-full" />
              </div>

              <div className="mt-4 w-full">
                <Input
                  type="text"
                  value={manualQrCode}
                  onChange={(e) => setManualQrCode(e.target.value)}
                  placeholder="Enter QR Code"
                  className="text-sm mb-2"
                />
                <Button
                  onClick={handleManualQrSubmit}
                  className="w-full bg-[#000066] hover:bg-[#000080] text-white text-sm"
                >
                  Validate QR Code
                </Button>
              </div>
            </div>

            <div className="mt-6 w-full flex justify-center">
              {!scanning ? (
                <Button
                  onClick={startScanner}
                  className="bg-[#000066] hover:bg-[#000080] text-white text-sm flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Start Scanner
                </Button>
              ) : (
                <Button
                  onClick={stopScanner}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm flex items-center gap-2"
                >
                  <Square className="w-4 h-4" />
                  Stop Scanner
                </Button>
              )}
            </div>
          </div>

          <div className="flex-1 bg-white/50 backdrop-blur-lg border border-gray-200 rounded-xl p-6 shadow-sm max-h-[calc(50vh-100px)] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <QrCode className="w-6 h-6 text-[#00004d]" />
              <h3 className="text-lg font-semibold text-[#00004d]">
                Scan QR to Pay
              </h3>
            </div>

            <p className="text-sm text-gray-600 mb-4">How to Pay</p>
            <ul className="space-y-3 text-gray-700 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-[#000066] font-semibold">•</span>
                Scan the vendor's QR code or enter it manually.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#000066] font-semibold">•</span>
                Confirm the amount and vendor details.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#000066] font-semibold">•</span>
                Complete your payment.
              </li>
            </ul>
          </div>
        </div>

        {/* Payment Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Complete Payment</DialogTitle>
            </DialogHeader>

            <div className="bg-[#f4f6ff] border text-sm text-gray-700 px-4 py-2 rounded mb-4 space-y-1">
              {parsedData.name && (
                <p>
                  <span className="font-medium text-[#00004d]">Name:</span>{" "}
                  {parsedData.name}
                </p>
              )}
              {parsedData.store && (
                <p>
                  <span className="font-medium text-[#00004d]">Store:</span>{" "}
                  {parsedData.store}
                </p>
              )}
              <p>
                <span className="font-medium text-[#00004d]">QR Code:</span>{" "}
                {result.length > 50 ? result.slice(0, 50) + "..." : result}
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <label className="text-sm text-gray-600">Amount (₹)</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="₹ Enter amount"
                step="0.01"
                min="0.01"
              />
            </div>

            <DialogFooter className="mt-4 flex justify-end">
              <Button
                onClick={handlePaymentSubmit}
                className="bg-[#000066] text-white"
              >
                Pay Now
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Payment Successful</DialogTitle>
            </DialogHeader>

            <div className="bg-[#e6ffef] border text-sm text-green-700 px-4 py-2 rounded mb-3 space-y-1">
              {parsedData.name && (
                <p>
                  <span className="font-medium text-green-900">Name:</span>{" "}
                  {parsedData.name}
                </p>
              )}
              {parsedData.store && (
                <p>
                  <span className="font-medium text-green-900">Store:</span>{" "}
                  {parsedData.store}
                </p>
              )}
              <p>
                <span className="font-medium text-green-900">QR Code:</span>{" "}
                {result.length > 50 ? result.slice(0, 50) + "..." : result}
              </p>
            </div>

            <p className="text-green-600 text-center font-semibold">
              ₹{amount} paid successfully!
            </p>

            <DialogFooter className="mt-4 flex justify-end">
              <Button
                onClick={() => setShowSuccessDialog(false)}
                variant="outline"
              >
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>

      <Card className="mt-10 w-full max-w-6xl p-8 rounded-2xl shadow-md bg-white mx-auto">
        <FoodStalls handlePayNow={handleManualPayNow} />
      </Card>
    </>
  );
};

export default QrScanner;