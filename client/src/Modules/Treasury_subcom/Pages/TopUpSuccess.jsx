import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function TopUpSuccess({ data, onNewTopUp }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md border rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <CardHeader className="flex flex-col items-center justify-center py-6 space-y-2">
          <div className="text-green-600 text-5xl">✅</div>
          <CardTitle className="text-[#070149] text-xl font-bold text-center">
            Top Up Complete!
          </CardTitle>
          <p className="text-sm text-gray-500 text-center">
            The card has been topped up successfully:
          </p>
        </CardHeader>

        {/* Content */}
        <CardContent>
          <div className="bg-gray-100 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">Customer:</span>
              <span>{data.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Amount Added:</span>
              <span>₹{data.amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Payment Method:</span>
              <span>{data.method}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">New Balance:</span>
              <span>₹{data.newBalance}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Transaction ID:</span>
              <span>{data.transactionId}</span>
            </div>
          </div>
        </CardContent>

        {/* Footer with button only (no background) */}
        <CardFooter className="justify-center p-4">
          <Button
            className="bg-[#070149] text-white text-base w-full hover:opacity-90"
            onClick={onNewTopUp}
          >
            New Top Up
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default TopUpSuccess;
