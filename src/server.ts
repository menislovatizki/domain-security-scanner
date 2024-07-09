import app from "./app";
import { config } from "./config/config";
import { getDatabaseConnection } from "./utils/connectionManager";
import { rabbitmqService } from "./services/rabbitmqService";
import { startCronJobs } from "./services/cronService";

const startServer = async () => {
  try {
    await getDatabaseConnection();
    console.log("Database connected successfully");
    
    await rabbitmqService.connect()
    console.log("RabbitMQ connected successfully");

    await startCronJobs();
    console.log("Cron jobs is started successfully");

    app.listen(config.port, () => {
      console.log(`Server is running on port ${config.port}`);
    });
  } catch (error) {
    console.error("Failed to start the server:", error);
    process.exit(1);
  }
};

startServer();
