"use client";

import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Cake, ShoppingCart, Search } from "lucide-react";

// Define gradient pool
const gradientPool = [
  "bg-gradient-to-r from-[#0d47a1] to-[#1976d2]",
  "bg-gradient-to-r from-[#4a148c] to-[#7b1fa2]",
  "bg-gradient-to-r from-[#00695c] to-[#004d40]",
  "bg-gradient-to-r from-[#ff6f00] to-[#ff8f00]",
  "bg-gradient-to-r from-[#c2185b] to-[#ad1457]",
  "bg-gradient-to-r from-[#1565c0] to-[#1e88e5]",
  "bg-gradient-to-r from-[#6a1b9a] to-[#8e24aa]",
  "bg-gradient-to-r from-[#283593] to-[#3f51b5]",
];

// Static stall list
const stalls = [
  {
    name: "Spice Corner",
    description: "Indian Cuisine",
    icon: <DollarSign size={48} />,
  },
  {
    name: "Sweet Treats",
    description: "Desserts & Bakery",
    icon: <Cake size={48} />,
  },
  {
    name: "Global Bites",
    description: "International Cuisine",
    icon: <ShoppingCart size={48} />,
  },
];

const FoodStalls = ({ handlePayNow }) => {
  const [search, setSearch] = useState("");

  const stallsWithGradients = useMemo(() => {
    return stalls.map((stall, index) => ({
      ...stall,
      gradient: gradientPool[index % gradientPool.length],
    }));
  }, []);

  const filteredStalls = stallsWithGradients.filter((stall) =>
    stall.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-[#00004d]">Food Stalls</h2>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search food items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 w-full rounded-full shadow-sm"
          />
        </div>
      </div>

      {filteredStalls.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStalls.map((stall, idx) => (
            <Card
              key={idx}
              className="rounded-xl shadow-md overflow-hidden p-0"
            >
              <div className={`p-6 text-white ${stall.gradient}`}>
                <div className="flex flex-col items-center text-center gap-2">
                  {stall.icon}
                  <h3 className="text-lg font-semibold">{stall.name}</h3>
                  <p className="text-sm opacity-90">{stall.description}</p>
                </div>
              </div>
              <CardContent className="p-4">
                <Button
                  className="w-full bg-[#00004d] hover:bg-[#000060] text-white"
                  onClick={() =>
                    handlePayNow({
                      name: stall.name,
                      store: stall.description,
                      result: `manual-${stall.name
                        .toLowerCase()
                        .replace(/\s/g, "-")}`,
                    })
                  }
                >
                  Pay Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center text-gray-500 py-12">
          <Search className="w-12 h-12 mb-4 text-gray-400" />
          <p className="text-lg font-semibold">No food stalls found</p>
          <p className="text-sm">Try a different search term.</p>
        </div>
      )}
    </div>
  );
};

export default FoodStalls;
