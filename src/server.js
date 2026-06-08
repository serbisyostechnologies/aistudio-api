import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "localhost";
const startServer = async () => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();