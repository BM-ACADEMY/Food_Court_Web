const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors =require('cors');
const helmet=require('helmet');
const morgan=require('morgan');
const cookieParser = require('cookie-parser');
// const createRateLimiter=require('./utils/rateLimiter');

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
const feeRoute=require('./route/feeRoute');
const upiRoute=require('./route/upiRoute');
const dashboardRoute=require('./route/dashboardRoute');

const app = express();
app.use(cookieParser());
app.use(cors({
  origin: [
    process.env.DEV_FRONTEND_URL,
    "https://pegasus2025.com",
    "https://www.pegasus2025.com"
  ],
  credentials: true,
}));

app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));
// app.use(createRateLimiter({
//   points: 10,
//   duration: 60, // 1 minute
// }));



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
app.use('/api/fees', feeRoute);
app.use('/api/upis',upiRoute);
app.use('/api/dashboards',dashboardRoute);

const PORT=process.env.PORT || 4000;
// Connect to MongoDB and then start the server
connectDB().then(() => {
  app.listen(PORT,'0.0.0.0', () => {
    console.log(`🚀 Server running on ${PORT}`);
  });
});