import {
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

const TransactionHistory = () => {
  const [filter, setFilter] = useState("All");

  const transactions = [
    {
      date: "Today",
      items: [
        { name: "Sweet Tracts", time: "May 16, 2023 • 3:45 PM", amount: -120 },
        {
          name: "Added to Wallet",
          time: "May 16, 2023 • 10:30 AM",
          amount: 200,
        },
      ],
    },
    {
      date: "Yesterday",
      items: [
        { name: "Spice Corner", time: "May 15, 2023 • 7:15 PM", amount: -180 },
        { name: "Global Bites", time: "May 15, 2023 • 1:20 PM", amount: -150 },
      ],
    },
  ];

  const parseTime = (str) => {
    const [datePart, timePart] = str.split("•").map((s) => s.trim());
    return new Date(`${datePart} ${timePart}`);
  };

  const filteredTransactions =
    filter === "All"
      ? transactions
      : transactions.filter((group) => group.date === filter);

  return (
    <Card className="mt-10 w-full max-w-6xl p-6 rounded-2xl shadow-md bg-white mx-auto">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl md:text-2xl font-bold text-[#00004d]">
    Transaction History
  </CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-gray-500">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {["All", "Today", "Yesterday"].map((option) => (
              <DropdownMenuItem
                key={option}
                onClick={() => setFilter(option)}
                className={filter === option ? "font-semibold text-blue-600" : ""}
              >
                {option}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="p-0">
        <div className="max-h-[600px] md:max-h-[400px] overflow-y-auto pr-2">
          {filteredTransactions.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-4">
              <div className="px-4 py-2 text-sm font-medium text-gray-500 bg-gray-50 sticky top-0 z-10">
                {group.date}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.items
                    .slice()
                    .sort((a, b) => parseTime(b.time) - parseTime(a.time))
                    .map((item, index) => (
                      <TableRow key={index} className="items-center">
                        <TableCell className="align-middle">
                          <div
                            className={`w-8 h-8 flex items-center justify-center rounded-full ${
                              item.amount > 0
                                ? "bg-green-100 text-green-600"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {item.amount > 0 ? (
                              <ArrowDownRight className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="align-middle text-left">
                          <p className="font-medium">{item.name}</p>
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <Clock className="w-3 h-3 mr-1" />
                            {item.time}
                          </div>
                        </TableCell>
                        <TableCell className="align-middle text-right font-medium">
                          <span
                            className={
                              item.amount > 0
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {item.amount > 0 ? "+" : "-"}₹{Math.abs(item.amount)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;
