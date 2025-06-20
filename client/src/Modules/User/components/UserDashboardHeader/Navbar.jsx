import React from "react";
import Pegasus from "@/assets/pegasus.png";

const UserDashboardHeader = () => {
  const user = {
    name: "John Doe",
    role: "customers",
    balance: 1250,
  };

  return (
    <header className="w-full bg-[#000052] text-white px-6 py-4 flex items-center justify-between shadow-md">
      {/* Left side: Logo and user details */}
      <div className="flex items-center gap-3">
        <img src={Pegasus} alt="Pegasus Logo" className="w-10 h-10" />
        <div>
          <h1 className="text-base md:text-base font-bold tracking-wide">PEGASUS 2K25</h1>
          <p className="text-sm md:text-xs font-medium text-white/80">
            {user.name} <span className="text-white/60">({user.role})</span>
          </p>
        </div>
      </div>

      {/* Right side: Balance Info */}
       <div className="text-right">
        <p className="text-xs sm:text-sm md:text-sm lg:text-base font-medium text-white/70">
          Your Balance
        </p>
        <p className="text-base sm:text-lg md:text-lg lg:text-2xl font-semibold">
          ₹ {user.balance}
        </p>
      </div>
    </header>
  );
};

export default UserDashboardHeader;
