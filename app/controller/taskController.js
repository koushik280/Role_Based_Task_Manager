const User = require("../model/userModel");
const Task = require("../model/taskModel");

class TaskController {
  // ================== Create Task ==================
  async createTask(req, res) {
    try {
      const { title, description, priority, assignedTo, dueDate } = req.body;
      // Validate assignedTo user
      const employee = await User.findById(assignedTo);
      if (!employee)
        return res.status(404).json({ message: "Assigned user not found" });
      if (employee.role !== "employee") {
        return res
          .status(400)
          .json({ message: "Tasks can only be assigned to employees" });
      }
      // Restriction: Admin can create tasks, but must assign through managers
      if (req.user.role === "admin") {
        return res
          .status(403)
          .json({ message: "Admin cannot assign directly to employees" });
      }
      //Manager can only assign to their team
      if (req.user.role === "manager") {
        if (
          !employee.manager ||
          employee.manager.toString() !== req.user._id.toString()
        ) {
          return res
            .status(403)
            .json({
              message: "You can only assign tasks to your own employees",
            });
        }
      }
      const task = await Task.create({
        title,
        description,
        priority,
        assignedBy: req.user._id,
        assignedTo,
        dueDate,
      });
      res.status(201).json({ message: "Task created successfully", task });
    } catch (err) {}
  }
  // ================== Get All Tasks ==================
  async getTasks(req, res) {
    try {
      let query = {};

      if (req.user.role === "manager") {
        query.assignedBy = req.user._id;
      } else if (req.user.role === "employee") {
        query.assignedTo = req.user._id;
      }

      const tasks = await Task.find(query)
        .populate("assignedBy", "name email role")
        .populate("assignedTo", "name email role");

      res.json(tasks);
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
  // ================== Get Single Task ==================
  async getTaskById(req, res) {
    try {
      const task = await Task.findById(req.params.id)
        .populate("assignedBy", "name email role")
        .populate("assignedTo", "name email role");

      if (!task) return res.status(404).json({ message: "Task not found" });

      // Employee can only see their own tasks
      if (
        req.user.role === "employee" &&
        task.assignedTo._id.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Manager can only see tasks they assigned
      if (
        req.user.role === "manager" &&
        task.assignedBy._id.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({ message: "Forbidden" });
      }

      res.json(task);
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
  // ================== Update Task ==================
  async updateTask(req, res) {
    try {
      const task = await Task.findById(req.params.id);
      if (!task) return res.status(404).json({ message: "Task not found" });

      // Employee: can only update their own task status
      if (req.user.role === "employee") {
        if (task.assignedTo.toString() !== req.user._id.toString()) {
          return res.status(403).json({ message: "Forbidden" });
        }
        task.status = req.body.status || task.status;
      }

      // Manager: can only update tasks they created
      else if (req.user.role === "manager") {
        if (task.assignedBy.toString() !== req.user._id.toString()) {
          return res.status(403).json({ message: "Forbidden" });
        }
        Object.assign(task, req.body);
      }

      // Admin / SuperAdmin: full access
      else {
        Object.assign(task, req.body);
      }

      await task.save();
      res.json({ message: "Task updated successfully", task });
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }

  // ================== Delete Task ==================
  async deleteTask(req, res) {
    try {
      const task = await Task.findById(req.params.id);
      if (!task) return res.status(404).json({ message: "Task not found" });

      // Manager: can only delete their own tasks
      if (
        req.user.role === "manager" &&
        task.assignedBy.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Employee cannot delete tasks
      if (req.user.role === "employee") {
        return res
          .status(403)
          .json({ message: "Employees cannot delete tasks" });
      }

      await task.deleteOne();
      res.json({ message: "Task deleted successfully" });
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
}

module.exports = new TaskController();
