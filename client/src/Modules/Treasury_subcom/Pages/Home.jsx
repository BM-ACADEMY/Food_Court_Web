import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, CreditCard, Users, Utensils, User, QrCode } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

function Home() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedUpiId, setSelectedUpiId] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(
    sessionStorage.getItem("dropdownSubmitted") === "true"
  );
  const [locations, setLocations] = useState([]);
  const [upiIds, setUpiIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:4000/api";

  const cards = [
    { title: "Register Customer", icon: UserPlus, color: "text-blue-600", path: "/treasury/register-customer" },
    { title: "Topup", icon: CreditCard, color: "text-green-600", path: "/treasury/topup-online-user" },
    { title: "Customer History", icon: Users, color: "text-purple-600", path: "/treasury/customer-history" },
    { title: "Restaurant History", icon: Utensils, color: "text-red-600", path: "/treasury/restaurant-history" },
    { title: "User History", icon: User, color: "text-orange-600", path: "/treasury/user-history" },
    // { title: "Generate QR", icon: QrCode, color: "text-indigo-600", path: "/treasury/generate-qr" },
  ];

  // Fetch locations and UPI IDs from backend
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        // Fetch locations
        const locationResponse = await axios.get(`${BASE_URL}/locations/fetch-all-locations`, {
          withCredentials: true,
        });
        if (locationResponse.data.success) {
          setLocations(locationResponse.data.data);
        } else {
          throw new Error(locationResponse.data.message || "Failed to fetch locations");
        }

        // Fetch UPI IDs
        const upiResponse = await axios.get(`${BASE_URL}/upis/fetch-all-upis`, {
          withCredentials: true,
        });
        if (upiResponse.data.data) {
          setUpiIds(upiResponse.data.data);
        } else {
          throw new Error("Failed to fetch UPI IDs");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(
          err.response?.data?.message ||
            "Failed to fetch locations or UPI IDs. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    if (!isSubmitted && !authLoading) {
      fetchData();
    }
  }, [isSubmitted, authLoading]);

  const handleSubmit = async () => {
    if (!user || !user._id) {
      setError("You must be logged in to proceed. Please log in and try again.");
      return;
    }

    if (selectedLocation && selectedUpiId) {
      setLoading(true);
      setError("");
      try {
        // Send request to update or create login log
        const response = await axios.put(
          `${BASE_URL}/login-logs/update-last-loginlog`,
          {
            user_id: user._id,
            location_id: selectedLocation,
            upi_id: selectedUpiId,
            login_time: new Date().toISOString(),
          },
          { withCredentials: true }
        );

        if (response.data.success) {
          setIsSubmitted(true);
          sessionStorage.setItem("dropdownSubmitted", "true");
        } else {
          throw new Error(response.data.message || "Failed to save login log");
        }
      } catch (err) {
        console.error("Error saving login log:", err);
        setError(
          err.response?.data?.message || "Failed to save login log. Please try again."
        );
      } finally {
        setLoading(false);
      }
    } else {
      setError("Please select both a location and a UPI ID.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 sm:p-6">
      {authLoading ? (
        <p className="text-blue-500 text-sm">Loading user data...</p>
      ) : !user ? (
        <p className="text-red-500 text-sm">Please log in to access this page.</p>
      ) : !isSubmitted ? (
        <div className="flex justify-center w-full max-w-md">
          <Card className="flex flex-col items-center justify-center w-full max-w-[300px] min-h-[200px] p-4">
            <CardHeader className="flex flex-col items-center p-4">
              <CardTitle className="text-base sm:text-lg font-semibold text-center">
                Select Options
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 w-full p-4">
              {loading && <p className="text-blue-500 text-sm">Loading...</p>}
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Select onValueChange={setSelectedLocation} value={selectedLocation}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location._id} value={location._id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select onValueChange={setSelectedUpiId} value={selectedUpiId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select UPI ID" />
                </SelectTrigger>
                <SelectContent>
                  {upiIds.map((upi) => (
                    <SelectItem key={upi._id} value={upi._id}>
                      {upi.upiName} ({upi.upiId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleSubmit}
                disabled={!selectedLocation || !selectedUpiId || loading || authLoading}
                className="w-full"
              >
                Submit
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-7xl w-full">
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card
                key={index}
                onClick={() => card.path && navigate(card.path)}
                className={`flex flex-col items-center justify-center transform transition-transform hover:-translate-y-2 hover:shadow-lg cursor-pointer w-full max-w-[300px] min-h-[200px] p-4 ${card.path ? '' : 'cursor-not-allowed'}`}
              >
                <CardHeader className="flex flex-col items-center p-4">
                  <Icon className={`h-8 w-8 ${card.color} mb-2`} />
                  <CardTitle className="text-base sm:text-lg font-semibold text-center whitespace-nowrap">
                    {card.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4" />
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Home;