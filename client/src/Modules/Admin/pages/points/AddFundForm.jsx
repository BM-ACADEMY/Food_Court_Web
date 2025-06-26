import React, { useState } from "react";
import axios from "axios";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast, Bounce } from "react-toastify";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

export default function AddFundModalForm({ senderId, receiver, onClose }) {
  const [amount, setAmount] = useState("");
  const [transactionType, setTransactionType] = useState("Transfer");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);

  const isFormInvalid = !amount || isNaN(amount) || Number(amount) <= 0;

  const handleSubmit = async (mode = "normal") => {
    if (isFormInvalid) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      setLoading(true);

      await axios.post(`${import.meta.env.VITE_BASE_URL}/transactions/transfer`, {
        sender_id: senderId,
        receiver_id: receiver.user_id,
        amount: Number(amount),
        transaction_type: transactionType,
        payment_method: paymentMethod,
        remarks,
        mode, // ⬅️ dynamic mode sent here
      });

      toast.success("Transaction successful", {
        position: "top-center",
        autoClose: 4000,
        theme: "colored",
        transition: Bounce,
      });

      onClose?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Transfer failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit("normal");
      }}
      className="space-y-4"
    >
      <h2 className="text-lg font-semibold">Transfer Funds to {receiver.name}</h2>

      {/* Amount */}
      <div>
        <Label className="mb-4">Amount</Label>
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
        />
      </div>

      {/* Transaction Type */}
      <div>
        <Label className="mb-4">Transaction Type</Label>
        <Select value={transactionType} onValueChange={setTransactionType}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select transaction type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Transfer">Transfer</SelectItem>
            <SelectItem value="TopUp">TopUp</SelectItem>
            <SelectItem value="Refund">Refund</SelectItem>
            <SelectItem value="Credit">Credit</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payment Method */}
      <div>
        <Label className="mb-4">Payment Method</Label>
        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select payment method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Cash">Cash</SelectItem>
            <SelectItem value="Gpay">Gpay</SelectItem>
            <SelectItem value="Mess bill">Mess bill</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Remarks */}
      <div>
        <Label className="mb-4">Remarks</Label>
        <Textarea
          placeholder="Optional remarks"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 ">
        <Button
          type="submit"
          className="flex flex-1/2 bg-[#00004D]"
          disabled={loading || isFormInvalid}
        >
          {loading ? (
            <svg
              className="animate-spin h-4 w-4 mr-2 text-white inline"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
          ) : (
            "Submit"
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="flex flex-1/2"
          onClick={() => handleSubmit("bulk")}
          disabled={loading || isFormInvalid}
        >
          Bulk Transfer
        </Button>
      </div>
    </form>
  );
}
