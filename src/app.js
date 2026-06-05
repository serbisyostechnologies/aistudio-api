import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

import userRouter from './routes/user.route.js';
import projectRouter from './routes/project.route.js';

app.use("/api/v1/users", userRouter);
app.use("/api/v1/projects", projectRouter);

app.get("/", (req, res) => {
  res.send("Welcome to AI Serbisyos Studio api service...");
});

export default app;