// import React, { useState } from "react";
// import axios from "axios";
// import { toast, Bounce } from "react-toastify";
// import { useAuth } from "@/context/AuthContext";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Button } from "@/components/ui/button";

// export default function AddPointForm({ onSuccess }) {
//     const { user } = useAuth();
//     const [loading, setLoading] = useState(false);
//     const [balance, setBalance] = useState("");
//     const [error, setError] = useState("");

//     const handleSubmit = async (e) => {
//         e.preventDefault();

//         // Validate input
//         if (!balance || isNaN(balance) || Number(balance) <= 0) {
//             setError("Please enter a valid number greater than 0.");
//             return;
//         }

//         setError("");
//         setLoading(true);

//         try {
//             await axios.post(`${import.meta.env.VITE_BASE_URL}/user-balance/create-or-update-balance`, {
//                 user_id: user._id,
//                 balance: Number(balance),
//             });

//             toast.success("Point Credited successfully", {
//                 position: "top-center",
//                 autoClose: 4000,
//                 theme: "colored",
//                 transition: Bounce,
//             });
//             setBalance("");
//             onSuccess?.(); // Close modal
//         } catch (err) {
//             toast.error("Failed to add points.");
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <form onSubmit={handleSubmit} className="space-y-4">
//             <div>
//                 <Label htmlFor="balance" className="mb-4 text-[#00004D]">Enter Points</Label>
//                 <Input
//                     id="balance"
//                     type="number"
//                     placeholder="Enter balance"
//                     value={balance}
//                     onChange={(e) => setBalance(e.target.value)}
//                 />
//                 {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
//             </div>

//             <Button type="submit" className="bg-[#00004D] cursor-pointer w-full" disabled={loading || !balance}>
//                 {loading && (
//                     <svg
//                         className="animate-spin h-4 w-4 mr-2 text-white inline"
//                         xmlns="http://www.w3.org/2000/svg"
//                         fill="none"
//                         viewBox="0 0 24 24"
//                     >
//                         <circle
//                             className="opacity-25"
//                             cx="12"
//                             cy="12"
//                             r="10"
//                             stroke="currentColor"
//                             strokeWidth="4"
//                         ></circle>
//                         <path
//                             className="opacity-75"
//                             fill="currentColor"
//                             d="M4 12a8 8 0 018-8v8H4z"
//                         ></path>
//                     </svg>
//                 )}
//                 {loading ? "Processing..." : "Add Points"}
//             </Button>
//         </form>
//     );
// }

import React, { useState } from "react";
import axios from "axios";
import { toast, Bounce } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";


export default function AddPointForm({ onSuccess }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [balance, setBalance] = useState("");
    const [transactionType, setTransactionType] = useState("Credit");
    const [paymentMethod, setPaymentMethod] = useState("");
    const [remarks, setRemarks] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!balance || isNaN(balance) || Number(balance) <= 0) {
            setError("Please enter a valid amount greater than 0.");
            return;
        }

        setError("");
        setLoading(true);

        try {
            await axios.post(`${import.meta.env.VITE_BASE_URL}/user-balance/create-or-update-balance-for-master-admin`, {
                user_id: user._id,
                balance: Number(balance),
                transaction_type: transactionType,
                payment_method: paymentMethod || undefined,
                remarks: remarks || undefined,
            });

            toast.success("Transaction successful", {
                position: "top-center",
                autoClose: 4000,
                theme: "colored",
                transition: Bounce,
            });
            setBalance("");
            setTransactionType("Credit");
            setPaymentMethod("");
            setRemarks("");
            onSuccess?.(); // trigger any parent modal close or refresh
        } catch (err) {
            toast.error("Failed to process transaction.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount */}
            <div>
                <Label htmlFor="balance" className="text-[#00004D] mb-4">Amount</Label>
                <Input
                    id="balance"
                    type="number"
                    placeholder="Enter amount"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                />
                {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
            </div>

            {/* Transaction Type */}
            <div>
                <Label htmlFor="transaction_type" className="mb-4">Transaction Type</Label>
                <Select
                    value={transactionType}
                    onValueChange={setTransactionType}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select transaction type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Credit">Credit</SelectItem>
                        <SelectItem value="TopUp">TopUp</SelectItem>
                        <SelectItem value="Refund">Refund</SelectItem>
                        <SelectItem value="Transfer">Transfer</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Payment Method */}
            <div>
                <Label htmlFor="payment_method" className="mb-4">Payment Method</Label>
                <Select
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                >
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
                <Label htmlFor="remarks" className="mb-4">Remarks</Label>
                <Textarea
                    id="remarks"
                    placeholder="Enter remarks (optional)"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                />
            </div>

            {/* Submit Button */}
            <Button
                type="submit"
                className="bg-[#00004D] cursor-pointer w-full"
                disabled={loading || !balance}
            >
                {loading && (
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
                )}
                {loading ? "Processing..." : "Add Points"}
            </Button>
        </form>
    );
}
