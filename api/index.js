import app from "../src/app.js";
import connectDB from "../src/config/db.connection.js";

let isConnected = false;

const handler = async (req, res) => {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }

  return app(req, res);
};

export default handler;