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
  QrCode,
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

const masterAdminNavLinks = [
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

const adminNavLinks = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: SquareTerminal,
  },
  {
    title: "Customer Users",
    url: "/admin/customers/customer-list",
    icon: Users,
  },
  {
    title: "Restaurant Users",
    url: "/admin/restaurant/restaurant-list",
    icon: ChefHat,
  },
  {
    title: "Treasury Subcom Users",
    url: "/admin/treasury-subcom/treasury-subcom-list",
    icon: UserCog,
  },
  {
    title: "Admin Users",
    url: "/admin/admin/admin-list",
    icon: Shield,
  },
  {
    title: "Transaction History",
    url: "/admin/transaction-history",
    icon: History,
  },
    {
    title: "Point Exchange",
    url: "/admin/points/point-exchange",
    icon: Coins,
  },
  {
    title: "Locations",
    url: "/admin/locations",
    icon: MapPin,
  },
  {
    title: "Upi",
    url: "/admin/upi",
    icon: FileText,
  },
  {
    title: "Offline Qrcode",
    url: "/admin/qrcode",
    icon: QrCode,
  },
];

export function AppSidebar(props) {
  const { user } = useAuth();
  const userName = user?.name || "User";

  let navItems = [];

  switch (user?.role?.role_id) {
    case "role-1":
      navItems = masterAdminNavLinks;
      break;
    case "role-2":
      navItems = adminNavLinks;
      break;
    default:
      navItems = []; // or handle other roles as needed
  }

  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader>
        <div className="px-4 py-2 font-semibold text-lg">Welcome, {userName}</div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>{/* Optional logout */}</SidebarFooter>
    </Sidebar>
  );
}
