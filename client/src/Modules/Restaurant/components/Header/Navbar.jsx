import React from "react";
import Pegasus from "@/assets/pegasus.png";

const RestaurantHeader = () => {
  const restaurant = {
    name: "Spice Garden",
  };

  return (
    <header className="w-full bg-[#000052] text-white px-6 py-4 flex items-center justify-between shadow-md">
      {/* Left side: Logo and dashboard info */}
      <div className="flex items-center gap-3">
        <img src={Pegasus} alt="Pegasus Logo" className="w-10 h-10" />
        <div>
          <h1 className="text-base md:text-base font-bold tracking-wide">PEGASUS 2K25</h1>
          <p className="text-sm md:text-xs font-medium text-white/80">Restaurant Dashboard</p>
        </div>
      </div>

      {/* Right side: Welcome message */}
      <div className="text-right">
        <p className="text-xs sm:text-sm md:text-sm lg:text-base font-medium text-white/70">
          Welcome,
        </p>
        <p className="text-base sm:text-lg md:text-lg lg:text-1xl font-semibold">
          {restaurant.name}
        </p>
      </div>
    </header>
  );
};

export default RestaurantHeader;
