import * as React from "react";
import {
  Users,
  UserCog,
  History,
  ChefHat,
  KeyRound,
  Coins,
  Shield,
  SquareTerminal,
  MapPin,
  FileText
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";

import { useAuth } from "@/context/AuthContext"; // ✅ import your auth hook

const navLinks = [
  {
    title: "Dashboard",
    url: "/master-admin",
    icon: SquareTerminal,
  },
  {
    title: "Customer Users",
    url: "/master-admin/customers/customer-list",
    icon: Users,
  },
  {
    title: "Restaurant Users",
    url: "/master-admin/restaurant/restaurant-list",
    icon: ChefHat,
  },
  {
    title: "Treasury Subcom Users",
    url: "/master-admin/treasury-subcom/treasury-subcom-list",
    icon: UserCog,
  },
  {
    title: "Admin Users",
    url: "/master-admin/admin/admin-list",
    icon: Shield,
  },
  {
    title: "Transaction History",
    url: "/master-admin/transaction-history",
    icon: History,
  },
  {
    title: "Add / Delete Access",
    url: "/master-admin/adddelete/add-new-user",
    icon: KeyRound,
  },
  {
    title: "Point Exchange",
    url: "/master-admin/points/point-exchange",
    icon: Coins,
  },
  {
    title: "Locations",
    url: "/master-admin/locations",
    icon: MapPin,
  },
  {
    title: "Upi",
    url: "/master-admin/upi",
    icon: FileText,
  },
];

export function AppSidebar(props) {
  const { user } = useAuth(); // ✅ Get user from context

  // Extract name
  const userName = user?.name || "User";

  // Filter nav items by role
  const filteredNav =
    user?.role?.role_id === "role-1"
      ? navLinks // Master Admin: full access
      : navLinks.filter((item) =>
          [
            "Dashboard",
            "Customer Users",
            "Restaurant Users",
            "Treasury Subcom Users",
            "Admin Users",
            "Transaction History",
          ].includes(item.title)
        );

  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader>
        <div className="px-4 py-2 font-semibold text-lg">Welcome, {userName}</div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNav} />
      </SidebarContent>
      <SidebarFooter>
        {/* Optional: Add logout or footer links */}
      </SidebarFooter>
    </Sidebar>
  );
}
