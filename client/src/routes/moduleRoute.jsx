// src/layouts/ModuleLayout.tsx
import { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function ModuleLayout({ children}) {
  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <SidebarProvider className="flex flex-col">
        <SiteHeader />
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset>
            <main className="flex-1 p-4 overflow-y-auto">{children}</main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
