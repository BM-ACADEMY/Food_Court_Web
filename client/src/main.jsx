import React, { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { RefreshProvider } from "./context/RefreshContext";
ReactDOM.createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RefreshProvider>
    <AuthProvider >
      <App />
    </AuthProvider>
    </RefreshProvider>
  </StrictMode>
);






// var start = new Date();
// start.setHours(0, 0, 0, 0);
// var end = new Date();
// end.setHours(23, 59, 59, 999);

// var restaurants = db.restaurants.find({}, { user_id: 1, restaurant_name: 1 }).toArray();

// var finalReport = [];

// restaurants.forEach(resto => {
//   var userId = resto.user_id;
//   var userIdStr = userId.toString();
//   var name = resto.restaurant_name;

//   var received = db.transactions.aggregate([
//     {
//       $match: {
//         receiver_id: userId,
//         created_at: { $gte: start, $lte: end },
//         status: "Success"
//       }
//     },
//     {
//       $project: {
//         amount: {
//           $cond: [
//             { $ifNull: ["$amount", false] },
//             { $toDouble: "$amount" },
//             0
//           ]
//         }
//       }
//     },
//     {
//       $group: {
//         _id: null,
//         totalReceived: { $sum: "$amount" },
//         receivedCount: { $sum: 1 }
//       }
//     }
//   ]).toArray();

//   var refunded = db.transactions.aggregate([
//     {
//       $match: {
//         sender_id: userId,
//         created_at: { $gte: start, $lte: end },
//         status: "Success"
//       }
//     },
//     {
//       $project: {
//         amount: {
//           $cond: [
//             { $ifNull: ["$amount", false] },
//             { $toDouble: "$amount" },
//             0
//           ]
//         }
//       }
//     },
//     {
//       $group: {
//         _id: null,
//         totalRefunded: { $sum: "$amount" },
//         refundedCount: { $sum: 1 }
//       }
//     }
//   ]).toArray();

//   var totalReceived = received[0]?.totalReceived || 0;
//   var receivedCount = received[0]?.receivedCount || 0;
//   var totalRefunded = refunded[0]?.totalRefunded || 0;
//   var refundedCount = refunded[0]?.refundedCount || 0;

//   finalReport.push({
//     restaurantUserId: userIdStr,
//     restaurantName: name,
//     totalReceived,
//     totalRefunded,
//     totalReceivedCount: receivedCount,
//     totalRefundedCount: refundedCount,
//     netSales: totalReceived - totalRefunded
//   });
// });

// finalReport;


// const start = new Date();
// start.setDate(start.getDate() - 1);
// start.setHours(0, 0, 0, 0);

// const end = new Date();
// end.setDate(end.getDate() - 1);
// end.setHours(23, 59, 59, 999);

// // Aggregation
// const report = db.transactions.aggregate([
//   {
//     $match: {
//       transaction_type: "TopUp",
//       status: "Success",
//       created_at: { $gte: start, $lte: end },
//       payment_method: { $in: ["Cash", "Gpay", "Mess bill"] }
//     }
//   },
//   {
//     $group: {
//       _id: {
//         sender_id: "$sender_id",
//         payment_method: "$payment_method"
//       },
//       totalAmount: { $sum: { $toDouble: "$amount" } },
//       count: { $sum: 1 }
//     }
//   },
//   {
//     $group: {
//       _id: "$_id.sender_id",
//       methods: {
//         $push: {
//           method: "$_id.payment_method",
//           totalAmount: "$totalAmount",
//           count: "$count"
//         }
//       }
//     }
//   },
//   {
//     $lookup: {
//       from: "users",
//       localField: "_id",
//       foreignField: "_id",
//       as: "user"
//     }
//   },
//   { $unwind: "$user" },
//   {
//     $lookup: {
//       from: "roles",
//       localField: "user.role_id",
//       foreignField: "_id",
//       as: "role"
//     }
//   },
//   { $unwind: "$role" },
//   {
//     $match: {
//       "role.name": "Treasury-Subcom"
//     }
//   },
//   {
//     $project: {
//       _id: 0,
//       treasuryUserId: "$_id",
//       name: "$user.name",
//       methods: 1
//     }
//   }
// ]);

// // Print result in shell
// report.forEach(doc => printjson(doc));