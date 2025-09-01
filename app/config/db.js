const mongoose = require("mongoose");

const dbConnection = async () => {
  try {
    dbcon = await mongoose.connect(process.env.MONGODB_URI);
    if (dbcon) {
      console.log("Database connected");
    }
  } catch (error) {
    console.log("Connection error",error);
    
  }
};

module.exports=dbConnection;