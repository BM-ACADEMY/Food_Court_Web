import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Html5Qrcode } from "html5-qrcode";
import RegistrationSuccess from "./RegistrationSuccess";
import {
  ScanLine,
  User,
  Mail,
  Phone,
  ArrowRightCircle,
} from "lucide-react";
import axios from "axios";

function RegisterCustomer() {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerName: "",
    email: "",
    phoneNumber: "",
  });
  const [userId, setUserId] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [fetchError, setFetchError] = useState("");
  const [registrationData, setRegistrationData] = useState(null);
  const [isStopping, setIsStopping] = useState(false);

  const qrRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  const startScanner = async () => {
    setCameraError("");
    try {
      if (html5QrCodeRef.current) {
        await stopScanner();
      }

      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 300, height: 350 } },
        (decodedText) => handleScanSuccess(decodedText),
        
      );
    } catch (err) {
      console.error("Camera start failed:", err);
      setCameraError(
        "Failed to access camera. Please enable camera permissions and try again."
      );
      html5QrCodeRef.current = null;
    }
  };

  const stopScanner = async () => {
    if (isStopping || !html5QrCodeRef.current) return;

    setIsStopping(true);
    try {
      const qrCode = html5QrCodeRef.current;
      if (qrCode && qrCode.isScanning) {
        await qrCode.stop();
        await qrCode.clear();
      }
      html5QrCodeRef.current = null;
    } catch (err) {
      console.error("Stop failed:", err.message);
    } finally {
      setIsStopping(false);
    }
  };

  const handleScanSuccess = async (decodedText) => {
    setFetchError("");
    try {
      const response = await axios.get("http://localhost:4000/api/customers/fetch-by-qr", {
        params: { qr_code: decodedText },
      });

      if (response.data.success && response.data.data) {
        const { name, email, phone_number, _id } = response.data.data.user_id;
        console.log("Scanned userId:", _id); // Debug log
        setUserId(_id);
        setFormData({
          customerName: name || "",
          email: email || "",
          phoneNumber: phone_number || "",
        });
      } else {
        setFetchError("No user found for this QR code.");
      }
    } catch (err) {
      console.error("Error fetching user by QR code:", err);
      setFetchError(
        err.response?.data?.message || "Failed to fetch user details. Please try again."
      );
    } finally {
      await stopScanner();
      setIsScannerOpen(false);
    }
  };

  useEffect(() => {
    if (isScannerOpen) {
      const timeout = setTimeout(() => {
        startScanner();
      }, 300);

      return () => {
        clearTimeout(timeout);
        stopScanner();
      };
    }
    return () => stopScanner();
  }, [isScannerOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!userId) {
      setFetchError("No user selected. Please scan a valid QR code.");
      return;
    }

    try {
      // Update user details
      const updateResponse = await axios.put(`http://localhost:4000/api/users/update-user/${userId}`, {
        name: formData.customerName,
        email: formData.email,
        phone_number: formData.phoneNumber,
      });

      if (!updateResponse.data.success) {
        throw new Error(updateResponse.data.message || "Failed to update user details");
      }

      // Fetch user balance
      let balance = "0.00";
      try {
        const balanceResponse = await axios.get(`http://localhost:4000/api/user-balance/fetch-balance-by-id/${userId}`);
        if (balanceResponse.data.success && balanceResponse.data.data) {
          balance = balanceResponse.data.data.balance.toString();
        }
      } catch (balanceErr) {
        if (balanceErr.response?.status === 404) {
          console.warn(`No balance found for userId ${userId}, defaulting to ₹0.00`);
        } else {
          throw balanceErr; // Rethrow other errors
        }
      }

      // Set registration data
      setRegistrationData({
        name: formData.customerName,
        phone: formData.phoneNumber,
        registrationTime: new Date().toLocaleString("en-IN", {
          hour: "numeric",
          minute: "numeric",
          hour12: true,
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        currentBalance: `₹${parseFloat(balance).toFixed(2)}`,
      });

      setIsRegistered(true);
    } catch (err) {
      console.error("Error during registration:", err);
      const errorMessage = err.response?.status === 404
        ? "User balance not found. Default balance used."
        : err.response?.data?.message || "Failed to register user. Please try again.";
      setFetchError(errorMessage);
    }
  };

  if (isRegistered && registrationData) {
    return <RegistrationSuccess registrationData={registrationData} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-xl min-h-[600px] pt-0 rounded-b-lg rounded-t-none shadow-lg">
        <CardHeader className="bg-[#070149] pt-0 rounded-t-none">
          <CardTitle className="text-3xl font-bold text-center text-white py-4">
            Register New User
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex justify-center mb-6">
            <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border border-[#070149] text-lg px-6 py-2 flex items-center gap-2"
                >
                  <ScanLine className="w-5 h-5" />
                  Open Scanner
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Scan QR Code</DialogTitle>
                </DialogHeader>
                <div className="relative w-full h-64 bg-gray-100 border border-dashed border-[#070149] rounded-lg overflow-hidden">
                  {!html5QrCodeRef.current && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ScanLine className="w-20 h-20 text-[#040442]" />
                    </div>
                  )}
                  <div id="qr-reader" ref={qrRef} className="w-full h-full" />
                </div>
                {cameraError && (
                  <p className="text-red-500 text-sm mt-2">{cameraError}</p>
                )}
                {fetchError && (
                  <p className="text-red-500 text-sm mt-2">{fetchError}</p>
                )}
                <Button
                  onClick={() => setIsScannerOpen(false)}
                  className="mt-4 bg-[#070149] hover:bg-[#3f3b6d] text-white"
                >
                  Close
                </Button>
              </DialogContent>
            </Dialog>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <label
                htmlFor="customerName"
                className="text-lg font-medium text-gray-700 mb-1 flex items-center gap-2"
              >
                <User className="w-5 h-5" />
                Customer Name
              </label>
              <Input
                id="customerName"
                name="customerName"
                type="text"
                value={formData.customerName}
                onChange={handleInputChange}
                className="text-lg h-12"
                placeholder="Enter customer name"
                required
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="text-lg font-medium text-gray-700 mb-1 flex items-center gap-2"
              >
                <Mail className="w-5 h-5" />
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className="text-lg h-12"
                placeholder="Enter email"
                required
              />
            </div>
            <div>
              <label
                htmlFor="phoneNumber"
                className="text-lg font-medium text-gray-700 mb-1 flex items-center gap-2"
              >
                <Phone className="w-5 h-5" />
                Phone Number
              </label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="text-lg h-12"
                placeholder="Enter phone number"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 text-lg bg-[#070149] hover:bg-[#3f3b6d] text-white flex items-center justify-center gap-2"
            >
              <ArrowRightCircle className="w-5 h-5" />
              Register User
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default RegisterCustomer;