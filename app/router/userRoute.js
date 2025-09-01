const express = require("express");

const auth = require("../middleware/auth");
const permit = require("../middleware/role");
const userController = require("../controller/userController");

const router = express.Router();

// GET all users
router.get(
  "/",
  auth,
  permit("superadmin", "admin"),
  userController.getAllUsers
);

// Change user role
router.patch(
  "/:id/role",
  auth,
  permit("superadmin"),
  userController.changeRole
);

// Activate/Deactivate
router.patch(
  "/:id/status",
  auth,
  permit("superadmin"),
  userController.changeStatus
);

router.post(
  "/assign",
  auth,
  permit("superadmin", "admin"),
  userController.assignEmployee
);

module.exports = router;
