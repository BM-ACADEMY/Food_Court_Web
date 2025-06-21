const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors =require('cors');

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
app.use(cors({ origin: '*' }));

// Optional: manually allow CORS headers for more control
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});


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

const PORT=process.env.PORT || 5000;
// Connect to MongoDB and then start the server
connectDB().then(() => {
  app.listen(PORT,'0.0.0.0', () => {
    console.log('🚀 Server running on http://localhost:5000');
  });
});
