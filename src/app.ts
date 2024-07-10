import express from "express";
import domainRoutes from "./routes/domainRoutes";

const app = express();

app.use(express.json());

app.use("/api", domainRoutes);

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

export default app;
