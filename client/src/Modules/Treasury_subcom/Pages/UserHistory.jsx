import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useNavigate } from "react-router-dom";
import { DollarSign, CheckCircle, Calendar, X, Download} from "lucide-react";

const UserHistory = () => {
  const navigate = useNavigate();
  const transactions = [
    { id: "TXN00087", customer: "Rahul Sharma (CUST001)", amount: "-₹250", date: "15/3/2023 02:32 pm", status: "Completed" },
    { id: "TXN00086", customer: "Priya Patel (CUST002)", amount: "-₹180", date: "15/3/2023 01:45 pm", status: "Completed" },
    { id: "TXN00085", customer: "Amit Kumar (CUST003)", amount: "-₹320", date: "15/3/2023 12:00 pm", status: "Completed" },
    { id: "TXN00084", customer: "Sneha Gupta (CUST004)", amount: "-₹150", date: "15/3/2023 11:15 am", status: "Completed" },
    { id: "TXN00083", customer: "Vikram Singh (CUST005)", amount: "-₹200", date: "15/3/2023 10:30 am", status: "Completed" },
    { id: "TXN00082", customer: "Neha Yadav (CUST006)", amount: "-₹300", date: "14/3/2023 03:10 pm", status: "Completed" },
    { id: "TXN00081", customer: "Rohit Jain (CUST007)", amount: "-₹220", date: "14/3/2023 02:05 pm", status: "Completed" },
    { id: "TXN00080", customer: "Kavita Sharma (CUST008)", amount: "-₹190", date: "14/3/2023 01:00 pm", status: "Completed" },
  ];

  const totalTransactions = 87;

  const handleClose = () => {
    navigate(-1);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <Card className="w-full max-w-5xl mx-auto border-l-4 border-l-gray-800 border-r-4 border-r-gray-200">
        <CardHeader className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 pb-2">
          <CardTitle className="text-lg sm:text-xl font-semibold">Transaction Overview</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <Card className="border-l-4 border-l-blue-600 border-r-4 border-r-blue-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-base sm:text-lg font-bold">₹10,000</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-600 border-r-4 border-r-green-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-base sm:text-lg font-bold">{totalTransactions}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-purple-600 border-r-4 border-r-purple-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-sm font-medium">Today's Transactions</CardTitle>
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-base sm:text-lg font-bold">0</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <Select>
              <SelectTrigger className="w-full sm:w-[180px] text-xs sm:text-sm">
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
              </SelectContent>
            </Select>
            <Input className="w-full sm:w-[300px] text-xs sm:text-sm" placeholder="Search by name, ID, or dc" />
            <Button className="w-full sm:w-[120px] bg-[#070149] text-white hover:bg-[#05012e] text-xs sm:text-sm flex items-center gap-1">
  <Download className="h-4 w-4" />
  Export
</Button>

          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm text-left text-gray-500 min-w-[600px]">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-2 sm:px-4 py-2">Transaction ID</th>
                  <th className="px-2 sm:px-4 py-2">Customer</th>
                  <th className="px-2 sm:px-4 py-2">Amount</th>
                  <th className="px-2 sm:px-4 py-2">Date & Time</th>
                  <th className="px-2 sm:px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction, index) => (
                  <tr key={index} className="bg-white border-b">
                    <td className="px-2 sm:px-4 py-2">{transaction.id}</td>
                    <td className="px-2 sm:px-4 py-2">{transaction.customer}</td>
                    <td className="px-2 sm:px-4 py-2">{transaction.amount}</td>
                    <td className="px-2 sm:px-4 py-2">{transaction.date}</td>
                    <td className="px-2 sm:px-4 py-2">
                      <Badge className="bg-green-100 text-green-800 text-xs">{transaction.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-4">
            <span className="text-xs sm:text-sm">Showing 1 to 8 of {totalTransactions} transactions</span>
            <div className="flex items-center gap-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" isActive>1</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#">2</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#">3</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext href="#" />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
          
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserHistory;
