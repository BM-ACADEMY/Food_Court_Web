"use client";

import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { CalendarDays, Search, Download } from "lucide-react";

const transactions = Array.from({ length: 87 }, (_, i) => ({
  id: `TXN000${87 - i}`,
  customer: ["Rahul Sharma", "Priya Patel", "Amit Kumar", "Sneha Gupta"][i % 4],
  customerId: `CUST00${(i % 5) + 1}`,
  amount: (i % 2 === 0 ? "+" : "-") + ((Math.floor(Math.random() * 300) + 100).toFixed(0)),
  date: `1${(i % 9) + 1}/9/2023`,
  time: `${(10 + (i % 5))}:3${i % 10} ${i % 2 === 0 ? "am" : "pm"}`,
  status: "Completed",
}));

const PER_PAGE = 15;

export default function TransactionDashboard() {
  const [currentPage, setCurrentPage] = useState(1);

  const paginated = transactions.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE
  );

  const totalPages = Math.ceil(transactions.length / PER_PAGE);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
  <Card className="bg-white border-l-4 border-blue-700 shadow-sm">
    <CardContent className="py-4">
      <p className="text-gray-500 text-sm">Current Balance</p>
      <p className="text-2xl font-semibold text-blue-900">₹10,000</p>
    </CardContent>
  </Card>

  <Card className="bg-white border-l-4 border-green-700 shadow-sm">
    <CardContent className="py-4">
      <p className="text-gray-500 text-sm">Total Transactions</p>
      <p className="text-2xl font-semibold text-green-900">87</p>
    </CardContent>
  </Card>

  <Card className="bg-white border-l-4 border-purple-700 shadow-sm">
    <CardContent className="py-4">
      <p className="text-gray-500 text-sm">Today's Transactions</p>
      <p className="text-2xl font-semibold text-purple-900">0</p>
    </CardContent>
  </Card>
</div>


      {/* Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarDays size={16} /> All Time
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Today</DropdownMenuItem>
              <DropdownMenuItem>This Week</DropdownMenuItem>
              <DropdownMenuItem>This Month</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <Input
              placeholder="Search by name, ID, or date"
              className="pl-8 text-sm"
            />
          </div>
        </div>
        <Button className="bg-blue-600 text-white hover:bg-blue-700 gap-2">
          <Download size={16} /> Export
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="w-full text-sm text-left border-t">
          <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
            <tr>
              <th className="p-4 font-medium">Transaction ID</th>
              <th className="p-4 font-medium">Customer</th>
              <th className="p-4 font-medium">Amount</th>
              <th className="p-4 font-medium">Date & Time</th>
              <th className="p-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((txn, index) => (
              <tr key={index} className="border-t hover:bg-gray-50">
                <td className="p-4">{txn.id}</td>
                <td className="p-4">
                  <div className="font-medium">{txn.customer}</div>
                  <div className="text-xs text-gray-500">{txn.customerId}</div>
                </td>
                <td className={`p-4 font-semibold ${txn.amount.startsWith("+") ? "text-green-600" : "text-red-600"}`}>
                  ₹{txn.amount.replace("+", "")}
                </td>
                <td className="p-4">{txn.date} {txn.time}</td>
                <td className="p-4 text-green-600 font-medium">Completed</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-end gap-2 text-sm">
        <Button variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
          Prev
        </Button>
        {Array.from({ length: totalPages }).map((_, i) => (
          <Button
            key={i}
            variant={currentPage === i + 1 ? "default" : "outline"}
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
          </Button>
        ))}
        <Button variant="outline" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
