const User = require("../model/userModel");

class UserController {
  async getAllUsers(req, res) {
    try {
      let query = {};
      // Admin cannot see superadmins
      if (req.user.role === "admin") {
        query.role = { $ne: "superadmin" };
      }
      const users = await User.find(query).select("-password -refreshToken");
      res.json(users);
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
  //Change User Role (SuperAdmin Only)
  async changeRole(req, res) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!["superadmin", "admin", "manager", "employee"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const user = await User.findById(id);
      if (!user) return res.status(404).json({ message: "User not found" });
      user.role = role;
      await user.save();
      res.status(200).json({ message: "Role updated successfully", user });
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
  //Activate/Deactivate User (SuperAdmin Only)

  async changeStatus(req, res) {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isActive = isActive;
    await user.save();

    res.json({
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      user,
    });
  }
  catch(err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }

  // ================== Assign Employee to Manager ==================
  async assignEmployee(req, res) {
    try {
      const { employeeId, managerId } = req.body;

      const employee = await User.findById(employeeId);
      const manager = await User.findById(managerId);

      if (!employee || !manager)
        return res.status(404).json({ message: "User not found" });

      if (employee.role !== "employee") {
        return res
          .status(400)
          .json({ message: "Only employees can be assigned to managers" });
      }
      if (manager.role !== "manager") {
        return res
          .status(400)
          .json({ message: "Only managers can have employees assigned" });
      }

      employee.manager = manager._id;
      await employee.save();

      res.json({
        message: "Employee assigned to manager successfully",
        employee,
      });
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
}

module.exports = new UserController();
