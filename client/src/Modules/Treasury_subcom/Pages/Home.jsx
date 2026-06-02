import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, CreditCard, Users, Utensils, User, QrCode, MapPin, Wallet, Sparkles, ChevronRight, Clock } from "lucide-react";
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
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-slate-950 flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[#000052]/5 blur-3xl" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-[#000052]/5 blur-3xl" />
        <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] rounded-full bg-[#000052]/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto flex justify-center">
      {authLoading ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#000052] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#000052] font-medium animate-pulse">Loading your experience...</p>
        </div>
      ) : !user ? (
        <Card className="w-full max-w-md border-0 shadow-2xl bg-white/80 backdrop-blur-xl dark:bg-slate-900/80">
          <CardContent className="p-8 flex flex-col items-center text-center gap-4">
            <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full text-red-500 mb-2">
              <User className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Access Denied</h2>
            <p className="text-slate-500 dark:text-slate-400">Please log in to access this page.</p>
          </CardContent>
        </Card>
      ) : !isSubmitted ? (
        <div className="w-full max-w-md mx-auto">
          <Card className="flex flex-col w-full border-0 shadow-2xl shadow-[#000052]/10 dark:shadow-none bg-white/90 backdrop-blur-xl dark:bg-slate-900/90 overflow-hidden group">
            <div className="h-2 w-full bg-[#000052]" />
            <CardHeader className="flex flex-col items-center p-8 pb-4">
              <div className="w-16 h-16 bg-[#000052]/10 dark:bg-[#000052]/30 rounded-2xl flex items-center justify-center mb-4 transform transition-transform group-hover:scale-110 group-hover:rotate-3 duration-300">
                <Sparkles className="w-8 h-8 text-[#000052] dark:text-blue-400" />
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-bold text-center text-[#000052] dark:text-blue-400">
                Session Setup
              </CardTitle>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 text-center">
                Configure your location and preferred UPI to continue
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-6 w-full p-8 pt-4">
              {loading && <p className="text-[#000052] text-sm font-medium text-center animate-pulse">Processing...</p>}
              {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm text-center border border-red-100 dark:border-red-800/30">{error}</div>}
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#000052] dark:text-blue-400" /> Location
                  </label>
                  <Select onValueChange={setSelectedLocation} value={selectedLocation}>
                    <SelectTrigger className="w-full h-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-[#000052]/20 dark:focus:ring-blue-400/20 transition-all">
                      <SelectValue placeholder="Choose a location" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {locations.map((location) => (
                        <SelectItem key={location._id} value={location._id} className="cursor-pointer">
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-[#000052] dark:text-blue-400" /> UPI ID
                  </label>
                  <Select onValueChange={setSelectedUpiId} value={selectedUpiId}>
                    <SelectTrigger className="w-full h-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-[#000052]/20 dark:focus:ring-blue-400/20 transition-all">
                      <SelectValue placeholder="Choose a UPI ID" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {upiIds.map((upi) => (
                        <SelectItem key={upi._id} value={upi._id} className="cursor-pointer">
                          {upi.upiName} ({upi.upiId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!selectedLocation || !selectedUpiId || loading || authLoading}
                className="w-full h-12 mt-2 bg-[#000052] hover:bg-[#000033] text-white font-medium text-lg rounded-xl shadow-lg shadow-[#000052]/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 group"
              >
                {loading ? 'Processing...' : 'Continue'}
                {!loading && <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl w-full mx-auto relative z-10">
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card
                key={index}
                onClick={() => card.path && navigate(card.path)}
                className={`flex flex-col items-center justify-center overflow-hidden group border-0 shadow-lg bg-white/90 backdrop-blur-md dark:bg-slate-900/90 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer w-full min-h-[220px] p-6 relative ${card.path ? '' : 'cursor-not-allowed opacity-70'}`}
              >
                {/* Decorative hover gradient */}
                <div className="absolute inset-0 bg-[#000052]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <CardHeader className="flex flex-col items-center p-4 z-10">
                  <div className={`p-4 rounded-2xl bg-[#000052]/5 dark:bg-slate-800 mb-4 transition-transform duration-300 group-hover:scale-110 shadow-sm text-[#000052] dark:text-blue-400`}>
                    <Icon className="h-10 w-10 text-[#000052] dark:text-blue-400" strokeWidth={1.5} />
                  </div>
                  <CardTitle className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 text-center whitespace-nowrap">
                    {card.title}
                  </CardTitle>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}

export default Home;