import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import Footer from "@/Modules/User/components/footer/Footer";

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col">
      <SidebarProvider className="flex flex-col flex-1">
        <SiteHeader />

        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset>
            <div className="flex flex-col flex-1 gap-4 p-4">
              {/* Replace with your dynamic content */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted/50 aspect-video rounded-xl" />
                <div className="bg-muted/50 aspect-video rounded-xl" />
                <div className="bg-muted/50 aspect-video rounded-xl" />
              </div>
              <div className="bg-muted/50 flex-1 rounded-xl" />
            </div>
             <Footer />
          </SidebarInset>
        </div>
      </SidebarProvider>

      {/* ✅ Footer always shown below the full content */}
     
    </div>
  );
}
