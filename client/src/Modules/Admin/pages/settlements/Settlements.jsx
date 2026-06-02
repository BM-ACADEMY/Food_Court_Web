import { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download, Calendar as CalendarIcon } from "lucide-react";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as DatePicker } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const API_BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:3000/api";

export default function Settlements() {
  const [settlements, setSettlements] = useState([]);
  const [daysLabels, setDaysLabels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState("all");

  const fetchSettlements = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/dashboards/restaurant-settlements`, {
        params: {
          startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined
        }
      });
      if (response.data.success) {
        setSettlements(response.data.data);
        setDaysLabels(response.data.days);
      }
    } catch (error) {
      console.error("Error fetching settlements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, [startDate]);

  const filteredSettlements = selectedRestaurant === "all" 
    ? settlements 
    : settlements.filter((rest) => rest.id === selectedRestaurant);

  const handleExport = () => {
    if (filteredSettlements.length === 0) return;

    const exportData = filteredSettlements.map((rest, index) => {
      const row = {
        "S.No": index + 1,
        "Restaurant Name": rest.restaurantName,
        "Owner Name": rest.ownerName,
        "Total Balance": rest.totalBalance.toFixed(2),
        "Total Last 6 Days": rest.totalSixDays.toFixed(2),
      };

      rest.dailyEarnings.forEach((day, idx) => {
        row[daysLabels[idx] || `Day ${idx + 1}`] = day.amount.toFixed(2);
      });

      return row;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Settlements");
    XLSX.writeFile(wb, `restaurant_settlements_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[#00004D]">Restaurant Settlements</h1>
        <div className="flex gap-2 items-center">
          <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Restaurants" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Restaurants</SelectItem>
              {settlements.map((rest) => (
                <SelectItem key={rest.id} value={rest.id}>
                  {rest.restaurantName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[200px] justify-start text-left font-normal cursor-pointer",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "dd-MM-yyyy") : "Select Start Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <DatePicker
                mode="single"
                selected={startDate}
                onSelect={(date) => setStartDate(date || null)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button
            onClick={handleExport}
            disabled={settlements.length === 0}
            variant="outline"
            className="cursor-pointer"
          >
            <Download className="mr-2 size-4" /> Export
          </Button>
          <Button
            onClick={fetchSettlements}
            disabled={isLoading}
            className="bg-[#00004D] cursor-pointer"
          >
            <RefreshCw className={`mr-2 size-4 ${isLoading ? 'animate-spin' : ''}`} /> 
            {isLoading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      <Card className="rounded-lg shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Daily Earnings & Balances</CardTitle>
          <p className="text-sm text-muted-foreground">
            Track daily transaction earnings for the last 6 days to calculate payouts.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Restaurant Name</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead className="text-right">Total Balance</TableHead>
                  {daysLabels.map((day, idx) => (
                    <TableHead key={idx} className="text-right whitespace-nowrap">{day}</TableHead>
                  ))}
                  <TableHead className="text-right font-bold text-[#00004D]">6-Day Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSettlements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4 + daysLabels.length} className="text-center py-6 text-muted-foreground">
                      No data available
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSettlements.map((rest) => (
                    <TableRow key={rest.id}>
                      <TableCell className="font-medium">{rest.restaurantName}</TableCell>
                      <TableCell>{rest.ownerName}</TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        ₹{rest.totalBalance.toFixed(2)}
                      </TableCell>
                      {rest.dailyEarnings.map((day, idx) => (
                        <TableCell key={idx} className="text-right">
                          ₹{day.amount.toFixed(2)}
                        </TableCell>
                      ))}
                      <TableCell className="text-right font-bold text-[#00004D]">
                        ₹{rest.totalSixDays.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
