"use client";

import { ChevronRight } from "lucide-react";
import { useLocation, Link } from "react-router-dom";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export function NavMain({ items }) {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Pages</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isParentActive = currentPath === item.url || item.items?.some(sub => sub.url === currentPath);
          return (
            <Collapsible key={item.title} asChild defaultOpen={isParentActive}>
              <SidebarMenuItem className={isParentActive ? "bg-gray-600 rounded-md" : ""}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <Link to={item.url} className="flex items-center gap-2 w-full">
                    <item.icon className={isParentActive ? "bg-gray-600 text-white rounded-md" : "text-[#00004D]"} />
                    <span className={isParentActive ? "bg-gray-600 text-white rounded-md" : "text-[#00004D]"} >{item.title}</span>
                  </Link>
                </SidebarMenuButton>

                {item.items?.length ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuAction className="data-[state=open]:rotate-90">
                        <ChevronRight />
                        <span className="sr-only">Toggle</span>
                      </SidebarMenuAction>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((subItem) => {
                          const isSubActive = currentPath === subItem.url;
                          return (
                            <SidebarMenuSubItem
                              key={subItem.title}
                              className={isSubActive ? "bg-white rounded-md" : ""}
                            >
                              <SidebarMenuSubButton asChild>
                                <Link to={subItem.url}>
                                  <span className="text-[#00004D]">{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : null}
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
