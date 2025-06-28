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

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";



export function SiteHeader() {
  const { toggleSidebar } = useSidebar();
  const { user, logout } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const navigate = useNavigate();



  const [openAccountModal, setOpenAccountModal] = useState(false);
  const handleHistory = () => {
    if (user.role.role_id === "role-1") {
      navigate('/master-admin/history')
    } else {
      navigate('/admin/history')
    }
  }

  const handleHomePage = () => {
    navigate('/')
  }

  return (
    <>
      <header className="bg-[#00004D] sticky top-0 z-50 w-full border-b px-2 py-2">
        <div className="flex flex-wrap items-center justify-between gap-y-2 px-2 sm:px-4">
          {/* LEFT SIDE */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 max-w-full">
            <Button className="h-8 w-8 shrink-0" variant="secondary" size="icon" onClick={toggleSidebar}>
              <SidebarIcon className="text-[#00004D]" />
            </Button>

            {/* Logo + Text */}
            <div className="flex items-center gap-2 flex-wrap">
              <img
                src={logo}
                alt="logo"
                className="h-8 w-8 shrink-0 cursor-pointer"
                onClick={handleHomePage}
              />
              <div className="leading-tight text-white text-sm sm:text-xs max-w-[180px]">
                <div
                  className="font-semibold cursor-pointer text-base sm:text-sm leading-tight truncate"
                  onClick={handleHomePage}
                >
                  Pegasus 2025
                </div>

                {/* User Name + Role + Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1 text-xs sm:text-[11px] text-white hover:underline focus:outline-none truncate">
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
                    <DropdownMenuItem onClick={() => setShowLogoutDialog(true)}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <Separator orientation="vertical" className="mx-2 h-6 hidden sm:block" />
          </div>

          {/* RIGHT SIDE */}
          <div className="flex flex-col items-end text-white text-xs sm:text-sm">
            <span>Account Balance</span>
            <span className="font-medium text-sm sm:text-base">
              ₹ {parseFloat(user?.balance || 0).toFixed(2)}
            </span>
          </div>
        </div>
      </header>

      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to log out of your account?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await logout();
                setShowLogoutDialog(false);
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Account Edit Modal */}
      {openAccountModal && (
        <EditAccountModal open={openAccountModal} onClose={() => setOpenAccountModal(false)} />
      )}
    </>
  );
}
