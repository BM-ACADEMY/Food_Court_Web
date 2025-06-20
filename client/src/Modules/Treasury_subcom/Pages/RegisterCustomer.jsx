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
import { BrowserQRCodeReader } from "@zxing/browser";
import RegistrationSuccess from "./RegistrationSuccess";

import {
  ScanLine,
  User,
  Mail,
  Phone,
  ArrowRightCircle,
} from "lucide-react";

function RegisterCustomer() {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerName: "",
    email: "",
    phoneNumber: "",
  });
  const [isRegistered, setIsRegistered] = useState(false);
  const videoRef = useRef(null);
  const codeReader = useRef(null);

  useEffect(() => {
    if (isScannerOpen && videoRef.current) {
      codeReader.current = new BrowserQRCodeReader();
      codeReader.current.decodeFromVideoDevice(
        null,
        videoRef.current,
        (result, error) => {
          if (result) {
            console.log("Scanned:", result.getText());
            setIsScannerOpen(false);
          }
          if (error && error.name !== "NotFoundException") {
            console.error(error);
          }
        }
      );
    }
    return () => {
      if (codeReader.current) {
        codeReader.current.reset();
      }
    };
  }, [isScannerOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = (e) => {
    e.preventDefault();
    console.log("Registering user:", formData);
    setIsRegistered(true);
  };

  if (isRegistered) {
    return <RegistrationSuccess />;
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
                  <DialogTitle>Scanner</DialogTitle>
                </DialogHeader>
                <video ref={videoRef} style={{ width: "100%" }} />
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
                className="block text-lg font-medium text-gray-700 mb-1 items-center gap-2"
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
                className="block text-lg font-medium text-gray-700 mb-1  items-center gap-2"
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
                className="block text-lg font-medium text-gray-700 mb-1 items-center gap-2"
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
