const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");
const authMiddleware= require("../middleware/authMiddleware")

// Base route: /api/users


// login function
router.post("/login", userController.loginUser);

//logout function
router.post("/logout", authMiddleware, userController.logoutUser);

//get the token
router.get("/me", userController.getMe);

router.get("/fetch-users-for-history", userController.getAllUsersforHistory);

router.get("/sessions", authMiddleware,userController.getSessionHistory);


// POST /api/users/create
router.post("/create-user", userController.createUser);

//verify otp
router.post("/verify-otp", userController.verifyOtp);

// GET /api/users/all
router.get("/fetch-all-users", userController.getUsers);

// GET /api/users/view/:id
router.get("/fetch-user-by-id/:id", userController.getUserById);

// PUT /api/users/update/:id
router.put("/update-user/:id", userController.updateUser);

// DELETE /api/users/delete/:id
router.delete("/delete-user/:id", userController.deleteUser);

module.exports = router;
