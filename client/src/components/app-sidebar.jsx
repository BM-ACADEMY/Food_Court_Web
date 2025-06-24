import * as React from "react"
import {
  BookOpen,
  Bot,
  Command,
  Frame,
  LifeBuoy,
  Map,
  PieChart,
  Send,
  Users,
  UserCog,
  History,
  ChefHat,
  KeyRound,
  Coins,
  Shield,
  SquareTerminal,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/master-admin",
      icon: SquareTerminal,
      isActive: true,
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
  ],
  // navSecondary: [
  //   {
  //     title: "Support",
  //     url: "#",
  //     icon: LifeBuoy,
  //   },
  //   {
  //     title: "Feedback",
  //     url: "#",
  //     icon: Send,
  //   },
  // ],

}

export function AppSidebar({
  ...props
}) {
  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}>
      <SidebarHeader>
        {/* <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div
                  className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Acme Inc</span>
                  <span className="truncate text-xs">Enterprise</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu> */}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        {/* <NavUser user={data.user} /> */}
      </SidebarFooter>
    </Sidebar>
  );
}
