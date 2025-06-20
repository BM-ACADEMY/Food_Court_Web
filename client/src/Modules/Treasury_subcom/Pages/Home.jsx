import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, CreditCard, Users, Utensils, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();
  const cards = [
   { title: "Register Customer", icon: UserPlus, color: "text-blue-600", path: "/register-customer" },
    { title: "Topup", icon: CreditCard, color: "text-green-600", path: "/topup-online-user" },
    { title: "Customer History", icon: Users, color: "text-purple-600", path: "/customer-history" },
    { title: "Restaurant History", icon: Utensils, color: "text-red-600", path: "/restaurant-history" },
    { title: "User History", icon: User, color: "text-orange-600", path: "user-history" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="flex flex-row gap-6 max-w-7xl overflow-x-auto">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card
              key={index}
              onClick={() => card.path && navigate(card.path)}
              className={`flex flex-col items-center justify-center transform transition-transform hover:-translate-y-2 hover:shadow-lg cursor-pointer w-[300px] min-h-[200px] ${card.path ? '' : 'cursor-not-allowed'}`}
            >
              <CardHeader className="flex flex-col items-center">
                <Icon className={`h-8 w-8 ${card.color} mb-2`} />
                <CardTitle className="text-lg font-semibold text-center whitespace-nowrap">
                  {card.title}
                </CardTitle>
              </CardHeader>
              <CardContent />
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default Home;