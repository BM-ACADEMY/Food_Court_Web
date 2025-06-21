import { SidebarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/components/ui/sidebar"
import logo from "@/assets/pegasus.png"

export function SiteHeader() {
  const { toggleSidebar } = useSidebar()

  return (
   <header className="bg-[#00004D] sticky top-0 z-50 p-2 flex w-full items-center border-b">

      <div className="flex h-[--header-height] w-full items-center justify-between px-4">
        {/* LEFT SIDE */}
        <div className="flex items-center gap-3">
          <Button className="h-8 w-8" variant="secondary" size="icon" onClick={toggleSidebar}>
            <SidebarIcon className="text-[#00004D]" />
          </Button>

          {/* Logo + Text */}
          <div className="flex items-center gap-2">
            <img src={logo} alt="logo" className="h-8 w-8" />
            <div className="leading-tight text-white text-sm">
              <div className="font-semibold">Pegasus 2025</div>
              <div className="text-xs">Login: username || user (Role)</div>
            </div>
          </div>

          <Separator orientation="vertical" className="mx-2 h-6" />

        </div>

        {/* RIGHT SIDE */}
        <div className="flex justify-end gap-2 flex-col  text-white text-sm">
          <span>Account Balance</span>
          <span className="font-medium">( ₹ 0.0 )</span>
        </div>
      </div>
    </header>

  );
}
