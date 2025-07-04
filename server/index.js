// const express = require('express');
// const dotenv = require('dotenv');
// const connectDB = require('./config/db');
// const cors = require('cors');
// const helmet = require('helmet');
// const morgan = require('morgan');
// const cookieParser = require('cookie-parser');
// const compression = require('compression');
// const http = require("http");
// const { initSocket } = require("./config/socket");

// // Load environment variables
// dotenv.config();

// // Routes
// const roleRoute = require('./route/roleRoute');
// const userRoute = require('./route/userRoute');
// const customerRoute = require('./route/customerRoute');
// const restaurantRoute = require('./route/restaurantRoute');
// const restaurantSubRoute = require('./route/restaurantSubRoute');
// const treasurySubcomRoute = require('./route/treasurySubcomRoute');
// const adminRoute = require('./route/adminRoute');
// const masterAdminRoute = require('./route/masterAdminRoute');
// const locationRoute = require('./route/locationRoute');
// const transactionRoute = require('./route/transactionRoute');
// const loginLogRoute = require('./route/loginLogRoute');
// const apiIntegrationRoute = require('./route/apiIntegrationRoute');
// const userBalanceRoute = require('./route/userBalanceRoute');
// const feeRoute = require('./route/feeRoute');
// const upiRoute = require('./route/upiRoute');
// const dashboardRoute = require('./route/dashboardRoute');

// const app = express();
// const server = http.createServer(app);


// // const allowedOrigins = [
// //   "https://pegasus2025.com",
// //   "https://www.pegasus2025.com"
// // ];
// const allowedOrigins = [
//   "http://localhost:5173",

// ];

// app.use(cookieParser());
// app.use(cors({
//   origin: function (origin, callback) {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, origin);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   credentials: true
// }));

// initSocket(server);

// app.use(helmet());
// app.use(express.json());
// app.use(morgan('dev'));
// app.use(compression());

// // Routes
// app.use('/api/roles', roleRoute);
// app.use('/api/users', userRoute);
// app.use('/api/customers', customerRoute);
// app.use('/api/restaurants', restaurantRoute);
// app.use('/api/restaurantSub', restaurantSubRoute);
// app.use('/api/treasurySubcom', treasurySubcomRoute);
// app.use('/api/admins', adminRoute);
// app.use('/api/master-admins', masterAdminRoute);
// app.use('/api/locations', locationRoute);
// app.use('/api/transactions', transactionRoute);
// app.use('/api/login-logs', loginLogRoute);
// app.use('/api/api-integrations', apiIntegrationRoute);
// app.use('/api/user-balance', userBalanceRoute);
// app.use('/api/fees', feeRoute);
// app.use('/api/upis', upiRoute);
// app.use('/api/dashboards', dashboardRoute);

// // Start server
// const PORT = process.env.PORT || 4000;
// connectDB().then(() => {
//   server.listen(PORT, '0.0.0.0', () => {
//     console.log(`🚀 Server + Socket.IO running on ${PORT}`);
//   });
// });


// // const allowedOrigins = [
// //   "http://localhost:5173",

// // ];









const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const http = require('http');
const { initSocket } = require('./config/socket');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
initSocket(server);

// ✅ Middleware
app.use(cookieParser());
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      "https://pegasus2025.com",
      "https://www.pegasus2025.com",
      "http://localhost:5173"
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, origin);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));
app.use(compression());

// ✅ Routes
app.use('/api/roles', require('./route/roleRoute'));
app.use('/api/users', require('./route/userRoute'));
app.use('/api/customers', require('./route/customerRoute'));
app.use('/api/restaurants', require('./route/restaurantRoute'));
app.use('/api/restaurantSub', require('./route/restaurantSubRoute'));
app.use('/api/treasurySubcom', require('./route/treasurySubcomRoute'));
app.use('/api/admins', require('./route/adminRoute'));
app.use('/api/master-admins', require('./route/masterAdminRoute'));
app.use('/api/locations', require('./route/locationRoute'));
app.use('/api/transactions', require('./route/transactionRoute'));
app.use('/api/login-logs', require('./route/loginLogRoute'));
app.use('/api/api-integrations', require('./route/apiIntegrationRoute'));
app.use('/api/user-balance', require('./route/userBalanceRoute'));
app.use('/api/fees', require('./route/feeRoute'));
app.use('/api/upis', require('./route/upiRoute'));
app.use('/api/dashboards', require('./route/dashboardRoute'));

// ✅ Optional: Health check route
app.get('/', (req, res) => {
  res.send('✅ API is running');
});

// ✅ Start server ONLY if run directly (not imported)
const PORT = process.env.PORT || 4000;

if (require.main === module) {
  connectDB().then(() => {
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server + Socket.IO running on port ${PORT}`);
    });
  });
}
