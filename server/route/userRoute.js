const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");

// Base route: /api/users

// POST /api/users/create
router.post("/create-user", userController.createUser);

// GET /api/users/all
router.get("/fetch-all-users", userController.getUsers);

// GET /api/users/view/:id
router.get("/fetch-user-by-id/:id", userController.getUserById);

// PUT /api/users/update/:id
router.put("/update-user/:id", userController.updateUser);

// DELETE /api/users/delete/:id
router.delete("/delete-user/:id", userController.deleteUser);

module.exports = router;
