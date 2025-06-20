import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const UserHistory = () => {
  const navigate = useNavigate();
  const transactions = [
    { id: "TXN00087", customer: "Rahul Sharma (CUST001)", amount: "-₹250", date: "15/3/2023 02:32 pm", status: "Completed" },
    { id: "TXN00086", customer: "Priya Patel (CUST002)", amount: "-₹180", date: "15/3/2023 01:45 pm", status: "Completed" },
    { id: "TXN00085", customer: "Amit Kumar (CUST003)", amount: "-₹320", date: "15/3/2023 12:20 pm", status: "Completed" },
    { id: "TXN00084", customer: "Sneha Gupta (CUST004)", amount: "-₹150", date: "15/3/2023 11:15 am", status: "Completed" },
    { id: "TXN00083", customer: "Vikram Singh (CUST005)", amount: "-₹200", date: "15/3/2023 10:30 am", status: "Completed" },
    { id: "TXN00082", customer: "Neha Yadav (CUST006)", amount: "-₹300", date: "14/3/2023 03:10 pm", status: "Completed" },
    { id: "TXN00081", customer: "Rohit Jain (CUST007)", amount: "-₹220", date: "14/3/2023 02:05 pm", status: "Completed" },
    { id: "TXN00080", customer: "Kavita Sharma (CUST008)", amount: "-₹190", date: "14/3/2023 01:00 pm", status: "Completed" },
  ];

  const totalTransactions = 87;
  const rowsPerPage = 8;
  const totalPages = Math.ceil(totalTransactions / rowsPerPage);

  const handleClose = () => {
    navigate(-1); // Navigate to the previous page in history
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-[70%] mx-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">Transaction Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
                <span className="text-gray-500 text-xs">$</span>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold">₹10,000</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                <span className="text-green-500 text-xs">✓</span>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold">{totalTransactions}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-sm font-medium">Today's Transactions</CardTitle>
                <span className="text-purple-500 text-xs">📅</span>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold">0</p>
              </CardContent>
            </Card>
          </div>
          <div className="flex flex-col md:flex-row gap-2 mb-4">
            <Select>
              <SelectTrigger className="w-full md:w-[180px] text-sm">
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
              </SelectContent>
            </Select>
            <Input className="w-full md:w-[300px] text-sm" placeholder="Search by name, ID, or dc" />
            <Button className="w-full md:w-[120px] bg-[#070149] text-white hover:bg-[#05012e] text-sm">
              Export
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-2">Transaction ID</th>
                  <th className="px-4 py-2">Customer</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Date & Time</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction, index) => (
                  <tr key={index} className="bg-white border-b">
                    <td className="px-4 py-2">{transaction.id}</td>
                    <td className="px-4 py-2">{transaction.customer}</td>
                    <td className="px-4 py-2">{transaction.amount}</td>
                    <td className="px-4 py-2">{transaction.date}</td>
                    <td className="px-4 py-2">
                      <Badge className="bg-green-100 text-green-800">{transaction.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center mt-4">
            <span>Showing 1 to 8 of {totalTransactions} transactions</span>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={true}>←</Button>
                <Button variant="outline" size="sm">1</Button>
                <Button variant="outline" size="sm">2</Button>
                <Button variant="outline" size="sm">3</Button>
                <Button variant="outline" size="sm">4</Button>
                <Button variant="outline" size="sm">5</Button>
                <Button variant="outline" size="sm">→</Button>
              </div>
              <Button variant="outline" size="sm" onClick={handleClose}>×</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserHistory;