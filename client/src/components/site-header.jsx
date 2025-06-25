// import { SidebarIcon } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Separator } from "@/components/ui/separator";
// import { useSidebar } from "@/components/ui/sidebar";
// import { useAuth } from "@/context/AuthContext"; // ✅ import Auth context
// import logo from "@/assets/pegasus.png";
// import { NavUser } from "./nav-user";

// export function SiteHeader() {
//   const { toggleSidebar } = useSidebar();
//   const { user } = useAuth(); // ✅ get user from context

//   return (
//     <header className="bg-[#00004D] sticky top-0 z-50 p-2 flex w-full items-center border-b">
//       <div className="flex h-[--header-height] w-full items-center justify-between px-4">
//         {/* LEFT SIDE */}
//         <div className="flex items-center gap-3">
//           <Button className="h-8 w-8" variant="secondary" size="icon" onClick={toggleSidebar}>
//             <SidebarIcon className="text-[#00004D]" />
//           </Button>

//           {/* Logo + Text */}
//           <div className="flex items-center gap-2">
//             <img src={logo} alt="logo" className="h-8 w-8" />
//             <div className="leading-tight text-white text-sm">
//               <div className="font-semibold">Pegasus 2025</div>
//               <div className="text-xs">
//                 {user?.name || "User"} ({user?.role?.name || "Role"})
//                 <NavUser user={user} />
//               </div>
//             </div>
//           </div>

//           <Separator orientation="vertical" className="mx-2 h-6" />
//         </div>

//         {/* RIGHT SIDE */}
//         <div className="flex justify-end gap-2 flex-col text-white text-sm text-right">
//           <span>Account Balance</span>
//           <span className="font-medium">₹ {parseFloat(user?.balance || 0).toFixed(2)}</span>
//         </div>
//       </div>
//     </header>
//   );
// }


import { useState } from "react";
import { SidebarIcon, LogOut, History, UserCog, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import logo from "@/assets/pegasus.png";
import EditAccountModal from "@/Modules/Master-admin/pages/account/EditAccountModal"; 
import { useNavigate } from "react-router-dom";




export function SiteHeader() {
  const { toggleSidebar } = useSidebar();
  const { user, logout } = useAuth();
  const navigate=useNavigate();

  const [openAccountModal, setOpenAccountModal] = useState(false);
  const handleHistory =()=>{
      navigate('/')
  }

  return (
    <>
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

                {/* User Name + Role + Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1 text-xs text-white hover:underline focus:outline-none">
                      {user?.name || "User"} ({user?.role?.name || "Role"})
                      <ChevronsUpDown className="ml-1 h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="min-w-44" side="bottom" align="start">
                    <DropdownMenuItem onClick={() => setOpenAccountModal(true)}>
                      <UserCog className="mr-2 h-4 w-4" />
                      Account
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleHistory}>
                      <History className="mr-2 h-4 w-4" />
                      History
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <Separator orientation="vertical" className="mx-2 h-6" />
          </div>

          {/* RIGHT SIDE */}
          <div className="flex justify-end gap-2 flex-col text-white text-sm text-right">
            <span>Account Balance</span>
            <span className="font-medium">₹ {parseFloat(user?.balance || 0).toFixed(2)}</span>
          </div>
        </div>
      </header>

      {/* Account Edit Modal */}
      {openAccountModal && (
        <EditAccountModal open={openAccountModal} onClose={() => setOpenAccountModal(false)} />
      )}
    </>
  );
}
