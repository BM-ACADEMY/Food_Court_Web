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
  const [customerId, setCustomerId] = useState(null);
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
      console.log(`Scanning QR code: ${decodedText}`);
      const response = await axios.get("http://localhost:4000/api/customers/fetch-by-qr", {
        params: { qr_code: decodedText },
      });
      console.log("Customer response:", JSON.stringify(response.data, null, 2));

      if (response.data.success && response.data.data) {
        const { user_id, customer_id } = response.data.data;
        const userIdString = user_id?._id ? user_id._id.toString() : user_id.toString();

        if (!userIdString || !/^[0-9a-fA-F]{24}$/.test(userIdString)) {
          throw new Error("Invalid user ID received from customer data");
        }

        console.log(`Fetching user for userId: ${userIdString}`);
        const userResponse = await axios.get(`http://localhost:4000/api/users/fetch-user-by-id/${userIdString}`);
        console.log("User response:", JSON.stringify(userResponse.data, null, 2));

        if (userResponse.data.success && userResponse.data.data) {
          const { name, email, phone_number } = userResponse.data.data;
          setUserId(userIdString);
          setCustomerId(customer_id);
          setFormData({
            customerName: name || "",
            email: email || "",
            phoneNumber: phone_number || "",
          });
        } else {
          setFetchError("No user details found for this QR code.");
        }
      } else {
        setFetchError("No customer found for this QR code.");
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
      console.log(`Updating user for userId: ${userId}`);
      const updateResponse = await axios.put(`http://localhost:4000/api/users/update-user/${userId}`, {
        name: formData.customerName,
        email: formData.email,
        phone_number: formData.phoneNumber,
      });
      console.log("User update response:", JSON.stringify(updateResponse.data, null, 2));

      if (!updateResponse.data) {
        throw new Error(updateResponse.data.message || "Failed to update user details");
      }

      let customerIdForDisplay = customerId;
      try {
        console.log(`Fetching customer for userId: ${userId}`);
        const customerResponse = await axios.get(`http://localhost:4000/api/customers/fetch-all-customer`, {
          params: { user_id: userId },
        });
        console.log("Customer response:", JSON.stringify(customerResponse.data, null, 2));
        if (customerResponse.data.success && customerResponse.data.data.length > 0) {
          customerIdForDisplay = customerResponse.data.data.find(c => c.user_id.toString() === userId)?.customer_id || customerId;
        }

      } catch (customerErr) {
        console.warn("Error fetching customer_id for display:", customerErr.response?.data || customerErr.message);
        customerIdForDisplay = customerId || "N/A";
      }

      // Include user_id in registrationData with consistent key
      setRegistrationData({
        name: formData.customerName,
        phone: formData.phoneNumber,
        customerId: customerIdForDisplay || "N/A",
        user_id: userId, // Changed from userId to user_id for consistency
        registrationTime: new Date().toLocaleString("en-IN", {
          hour: "numeric",
          minute: "numeric",
          hour12: true,
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
      });
      setIsRegistered(true);

    } catch (err) {
      console.error("Error during registration:", err);
      const errorMessage = err.response?.status === 400
        ? err.response.data.message || "Invalid user data. Please try again."
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