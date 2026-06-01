const fs = require('fs');
let content = fs.readFileSync('server/controller/transactionController.js', 'utf8');

// Replace Revenue
content = content.replace(
  '          totalRevenue: { $sum: { $toDouble: "$amount" } },\r\n          avgTransactionValue: { $avg: { $toDouble: "$amount" } },',
  `          totalRevenue: { $sum: { $cond: [ { $eq: ["$transaction_type", "Transfer"] }, { $toDouble: "$amount" }, 0 ] } },\r\n          avgTransactionValue: { $avg: { $cond: [ { $eq: ["$transaction_type", "Transfer"] }, { $toDouble: "$amount" }, null ] } },`
);
content = content.replace(
  '          totalRevenue: { $sum: { $toDouble: "$amount" } },\n          avgTransactionValue: { $avg: { $toDouble: "$amount" } },',
  `          totalRevenue: { $sum: { $cond: [ { $eq: ["$transaction_type", "Transfer"] }, { $toDouble: "$amount" }, 0 ] } },\n          avgTransactionValue: { $avg: { $cond: [ { $eq: ["$transaction_type", "Transfer"] }, { $toDouble: "$amount" }, null ] } },`
);

// Replace Chart Transactions
content = content.replace(
  /\$cond: \[\{ \$ne: \["\$_id\.type", "Refund"\] \}, "\$amount", 0\],/g,
  '$cond: [{ $eq: ["$_id.type", "Transfer"] }, "$amount", 0],'
);

fs.writeFileSync('server/controller/transactionController.js', content);
