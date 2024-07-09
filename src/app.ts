import express from "express";
import domainRoutes from "./routes/domainRoutes";
// import { CronService } from "./services/cronService";

const app = express();

app.use(express.json());

app.use("/domains", domainRoutes);

// Error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
  }
);

// Start cron jobs
// CronService.getInstance().startCronJobs();

export default app;
