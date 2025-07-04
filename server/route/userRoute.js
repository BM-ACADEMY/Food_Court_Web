const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");
const authMiddleware= require("../middleware/authMiddleware")

// Base route: /api/users


// login function
router.post("/login", userController.loginUser);

router.post("/verify-credentials", userController.verifyCredentials);

//logout function
router.post("/logout", authMiddleware, userController.logoutUser);

//get the token
router.get("/me", userController.getMe);

router.get("/fetch-users-for-history",authMiddleware, userController.getAllUsersforHistory);

router.get("/fetch-users-for-transaction",authMiddleware, userController.getTransactionDetails);

router.get("/sessions", authMiddleware,userController.getSessionHistory);

// GET /api/users/with-balance-by-role/:role_id?page=1
router.get("/with-balance-by-role/:role_id", userController.getUsersWithBalanceByRole);

// POST /api/users/create
router.post("/create-user", userController.createUser);

//verify otp
router.post("/verify-otp", userController.verifyOtp);
router.post("/verify-otp-login-otp", userController.verifyMobileLoginOtp);

router.post("/send-otp-number", userController.sendOtpController);

// GET /api/users/all
router.get("/fetch-all-users", userController.getUsers);

// GET /api/users/view/:id
router.get("/fetch-user-by-id/:id", userController.getUserById);

// PUT /api/users/update/:id
router.put("/update-user/:id", userController.updateUser);

router.put("/update-user-flag/:id", userController.updateUserFlag);

// DELETE /api/users/delete/:id
router.delete("/delete-user/:id", userController.deleteUser);

// Add to existing routes
router.get("/fetch-by-phone", userController.getUserByPhone);

// routes/authRoutes.js
router.post("/forgot-password", userController.forgotPassword);

router.post("/reset-password/:token", userController.resetPassword);



module.exports = router;
