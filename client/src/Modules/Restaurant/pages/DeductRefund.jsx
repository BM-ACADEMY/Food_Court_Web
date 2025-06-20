import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import Deduct from '@/Modules/Restaurant/pages/Deduct';
import Refund from '@/Modules/Restaurant/pages/Refund';

const DeductRefund = () => {
  const [activeTab, setActiveTab] = useState("deduct");

  return (
    <div className="container mx-auto p-4">
      {/* Centered Tabs */}
      <div className="flex justify-center gap-4 mb-2">
        <Button
          onClick={() => setActiveTab("deduct")}
          className={`rounded-none px-4 py-2 font-medium bg-transparent shadow-none transition-all hover:bg-transparent ${
            activeTab === "deduct"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500"
          }`}
        >
          Deduct Points
        </Button>
        <Button
          onClick={() => setActiveTab("refund")}
          className={`rounded-none px-4 py-2 font-medium bg-transparent shadow-none transition-all hover:bg-transparent ${
            activeTab === "refund"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500"
          }`}
        >
          Refund Points
        </Button>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === "deduct" && <Deduct />}
        {activeTab === "refund" && <Refund/>}
      </div>
    </div>
  );
};

export default DeductRefund;
