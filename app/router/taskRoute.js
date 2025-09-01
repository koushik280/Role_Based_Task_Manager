const express = require("express");
const auth = require("../middleware/auth");
const permit = require("../middleware/role");
const taskController = require("../controller/taskController");
const router = express.Router();

// Create task → manager, superadmin (admin cannot assign directly)
router.post(
  "/",
  auth,
  permit("superadmin", "admin", "manager"),
  taskController.createTask
);

// Get all tasks → depends on role
router.get(
  "/",
  auth,
  permit("superadmin", "admin", "manager", "employee"),
  taskController.getTasks
);

// Get task by ID
router.get(
  "/:id",
  auth,
  permit("superadmin", "admin", "manager", "employee"),
  taskController.getTaskById
);

// Update task
router.patch(
  "/:id",
  auth,
  permit("superadmin", "admin", "manager", "employee"),
  taskController.updateTask
);

// Delete task
router.delete(
  "/:id",
  auth,
  permit("superadmin", "admin", "manager"),
  taskController.deleteTask
);

module.exports = router;
