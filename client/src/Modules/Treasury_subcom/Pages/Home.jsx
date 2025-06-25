import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, CreditCard, Users, Utensils, User, QrCode } from "lucide-react";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();
  const cards = [
    { title: "Register Customer", icon: UserPlus, color: "text-blue-600", path: "/treasury/register-customer" },
    { title: "Topup", icon: CreditCard, color: "text-green-600", path: "/treasury/topup-online-user" },
    { title: "Customer History", icon: Users, color: "text-purple-600", path: "/treasury/customer-history" },
    { title: "Restaurant History", icon: Utensils, color: "text-red-600", path: "/treasury/restaurant-history" },
    { title: "User History", icon: User, color: "text-orange-600", path: "/treasury/user-history" },
    { title: "Generate QR", icon: QrCode, color: "text-indigo-600", path: "/treasury/generate-qr" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 sm:p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 max-w-7xl w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide p-4">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card
              key={index}
              onClick={() => card.path && navigate(card.path)}
              className={`flex flex-col items-center justify-center transform transition-transform hover:-translate-y-2 hover:shadow-lg cursor-pointer w-full max-w-[300px] min-h-[200px] snap-center p-4 ${card.path ? '' : 'cursor-not-allowed'}`}
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
    </div>
  );
}

export default Home;
