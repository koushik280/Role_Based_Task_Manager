require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();

//middleware
app.use(express.json());
app.use(cookieParser());

//authRoutes
const authRoute = require("./app/router/authRoute");
app.use("/auth", authRoute);

//userRoute
const userRoute = require("./app/router/userRoute");
app.use("/users", userRoute);

//taskRoute
const taskRoutes = require("./app/router/taskRoute");
app.use("/tasks", taskRoutes);

//database
const database = require("./app/config/db");
database();

//server
const port = 5000 || process.env.PORT;
app.listen(port, () => {
  console.log(`Server is runnig at ${port}`);
});
