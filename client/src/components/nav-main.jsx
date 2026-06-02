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
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  tooltip={item.title}
                  isActive={isParentActive}
                  className={
                    isParentActive 
                      ? "!bg-[#01004c] !text-white hover:!bg-[#01004c]/90 shadow-md transition-all duration-200" 
                      : "text-[#01004c] hover:bg-[#01004c]/10 hover:text-[#01004c] transition-all duration-200"
                  }
                >
                  <Link to={item.url} className="flex items-center gap-3 w-full px-1">
                    <item.icon className="shrink-0 size-5" />
                    <span className="font-medium tracking-wide">{item.title}</span>
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
