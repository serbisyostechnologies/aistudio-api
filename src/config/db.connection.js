import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.DB_NAME,
      maxPoolSize: 50,
      minPoolSize: 5,
    });

    console.log(`MongoDB Connected`);
    await mongoose.connection.syncIndexes();
    console.log("Indexes synced");
  } catch (error) {
    console.error("DB Connection Error:", error.message);
    process.exit(1);
  }
};