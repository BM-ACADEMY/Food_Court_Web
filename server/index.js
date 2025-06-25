const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors =require('cors');
const helmet=require('helmet');
const morgan=require('morgan');
const cookieParser = require('cookie-parser');

// Load environment variables from .env file
dotenv.config();

const roleRoute=require('./route/roleRoute');
const userRoute=require('./route/userRoute');
const customerRoute=require('./route/customerRoute');
const restaurantRoute=require('./route/restaurantRoute');
const restaurantSubRoute=require('./route/restaurantSubRoute');
const treasurySubcomRoute=require('./route/treasurySubcomRoute');
const adminRoute=require('./route/adminRoute');
const masterAdminRoute=require('./route/masterAdminRoute');
const locationRoute=require('./route/locationRoute');
const transactionRoute=require('./route/transactionRoute');
const loginLogRoute=require('./route/loginLogRoute');
const apiIntegrationRoute=require('./route/apiIntegrationRoute');
const userBalanceRoute=require('./route/userBalanceRoute');
const app = express();
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.DEV_FRONTEND_URL, // your frontend URL
    credentials: true, // allow cookies (required for JWT in cookies)
  })
);


app.use(cors({
  origin: process.env.FRONTEND_URL, // ✅ only your frontend domain
  credentials: true,                // ✅ required for cookies
}));

// app.use(cors({
//     origin: [process.env.FRONTEND_URL, process.env.PRODUCTION_URL],
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
//     allowedHeaders: ['Content-Type', 'Authorization']
// }))

// app.use((req, res, next) => {
//     const allowedOrigins = [process.env.FRONTEND_URL, process.env.PRODUCTION_URL];
//     const origin = req.headers.origin;
    
//     if (allowedOrigins.includes(origin)) {
//         res.header("Access-Control-Allow-Origin", origin);
//     }

//     res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
//     next();
// });
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));
// Optional: manually allow CORS headers for more control
// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", process.env.DEV_FRONTEND_URL); // ✅ must match exact origin
//   res.header("Access-Control-Allow-Credentials", "true"); // ✅ required for cookies
//   res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
//   next();
// });


app.use('/api/roles',roleRoute);
app.use('/api/users',userRoute);
app.use('/api/customers',customerRoute);
app.use('/api/restaurants',restaurantRoute);
app.use('/api/restaurantSub',restaurantSubRoute);
app.use('/api/treasurySubcom',treasurySubcomRoute);
app.use('/api/admins',adminRoute);
app.use('/api/master-admins',masterAdminRoute);
app.use('/api/locations',locationRoute);
app.use('/api/transactions',transactionRoute);
app.use('/api/login-logs',loginLogRoute);
app.use('/api/api-integrations',apiIntegrationRoute);
app.use('/api/user-balance',userBalanceRoute);

const PORT=process.env.PORT || 4000;
// Connect to MongoDB and then start the server
connectDB().then(() => {
  app.listen(PORT,'0.0.0.0', () => {
    console.log(`🚀 Server running on ${PORT}`);
  });
});
