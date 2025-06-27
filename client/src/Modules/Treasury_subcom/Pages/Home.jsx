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

function Home() {
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedUpiId, setSelectedUpiId] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(
    sessionStorage.getItem("dropdownSubmitted") === "true"
  );

  const cards = [
    { title: "Register Customer", icon: UserPlus, color: "text-blue-600", path: "/treasury/register-customer" },
    { title: "Topup", icon: CreditCard, color: "text-green-600", path: "/treasury/topup-online-user" },
    { title: "Customer History", icon: Users, color: "text-purple-600", path: "/treasury/customer-history" },
    { title: "Restaurant History", icon: Utensils, color: "text-red-600", path: "/treasury/restaurant-history" },
    { title: "User History", icon: User, color: "text-orange-600", path: "/treasury/user-history" },
    // { title: "Generate QR", icon: QrCode, color: "text-indigo-600", path: "/treasury/generate-qr" },
  ];

  const locations = ["New York", "London", "Tokyo", "Mumbai", "Sydney"];
  const upiIds = ["user1@upi", "user2@upi", "user3@upi", "user4@upi"];

  useEffect(() => {
    // Optional: If you have a logout function, clear the sessionStorage flag
    // This could be handled in a logout component or function
    const handleLogout = () => {
      sessionStorage.removeItem("dropdownSubmitted");
    };

    // Add event listener for logout if needed (example, adjust based on your app's logout mechanism)
    // window.addEventListener("logout", handleLogout);
    // return () => window.removeEventListener("logout", handleLogout);
  }, []);

  const handleSubmit = () => {
    if (selectedLocation && selectedUpiId) {
      setIsSubmitted(true);
      sessionStorage.setItem("dropdownSubmitted", "true");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 sm:p-6">
      {!isSubmitted ? (
        <div className="flex justify-center w-full max-w-md">
          <Card className="flex flex-col items-center justify-center w-full max-w-[300px] min-h-[200px] p-4">
            <CardHeader className="flex flex-col items-center p-4">
              <CardTitle className="text-base sm:text-lg font-semibold text-center">
                Select Options
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 w-full p-4">
              <Select onValueChange={setSelectedLocation} value={selectedLocation}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select onValueChange={setSelectedUpiId} value={selectedUpiId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select UPI ID" />
                </SelectTrigger>
                <SelectContent>
                  {upiIds.map((upiId) => (
                    <SelectItem key={upiId} value={upiId}>
                      {upiId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleSubmit}
                disabled={!selectedLocation || !selectedUpiId}
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