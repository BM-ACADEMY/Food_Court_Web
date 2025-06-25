import React, { useEffect, useState } from "react";
import axios from "axios";
import { DollarSign, Users, ArrowRightLeft } from "lucide-react";


export default function DashboardCards() {
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/user-balance/dashboard-summary`);
        setDashboardData(res.data.data);
      } catch (error) {
        console.error("Failed to load dashboard summary", error);
      }
    };

    fetchSummary();
  }, []);

  if (!dashboardData) return <p className="text-center text-muted">Loading summary...</p>;

  const master = dashboardData["Master-Admin"];
  const subcom = dashboardData["Treasury-Subcom"];
  const admin = dashboardData["Admin"];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <CardComponent
        title="Main Account Points"
        amount={`₹ ${master?.totalBalance.toLocaleString()}`}
        subtitle={`+₹ ${master?.difference.toLocaleString()} from last month`}
        icon={<DollarSign className="text-blue-600" />}
        bg="blue-100"
      />
      <CardComponent
        title="Total Subcom Points"
        amount={`₹ ${subcom?.totalBalance.toLocaleString()}`}
        subtitle={`Distributed across ${subcom?.userCount} members`}
        icon={<Users className="text-green-600" />}
        bg="green-100"
      />
      <CardComponent
        title="Total Admin Points"
        amount={`₹ ${admin?.totalBalance.toLocaleString()}`}
        subtitle={`₹ ${admin?.currentMonthBalance.toLocaleString()} transferred this month`}
        icon={<ArrowRightLeft className="text-purple-600" />}
        bg="purple-100"
      />
    </div>
  );
}
const CardComponent = ({ title, amount, subtitle, icon, bg }) => (
    <div className="p-5 rounded-xl bg-white shadow flex justify-between items-center">
        <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold">{amount}</h3>
            <p className="text-sm text-green-600 mt-1">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-full bg-${bg}`}>{icon}</div>
    </div>
);
