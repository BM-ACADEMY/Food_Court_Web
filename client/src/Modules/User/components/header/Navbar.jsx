// components/Header.tsx
import React from 'react'
import Pegasus from "@/assets/pegasus.png";
import Cmc from "@/assets/cmc.png"
const Header = () => {
  return (
    <header className="w-full bg-[#07014A] text-white px-6 py-3 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-2">
        <img
          src={Pegasus} 
          alt="Pegasus Logo"
          className="w-8 h-8"
        />
        <span className="text-lg font-bold tracking-wide">PEGASUS 2K25</span>
      </div>

      <div>
        <img
          src={Cmc} 
          alt="CMC Logo"
          className="w-10 h-10 rounded-full border border-white p-1"
        />
      </div>
    </header>
  );
};

export default Header;  
