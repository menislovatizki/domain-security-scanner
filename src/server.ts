import app from "./app";
import { config } from "./config/config";
import { getDatabaseConnection } from "./utils/databaseConnectionManager";
import { initializeRabbitMQ } from "./utils/rabbitmqOperations";
import { cronService } from "./services/cronService";

const startServer = async () => {
  try {
    const initializationTasks = [
      { name: 'Database', task: getDatabaseConnection },
      { name: 'RabbitMQ', task: initializeRabbitMQ },
      { name: 'Cron Service', task: () => cronService.initialize() }
    ];

    const results = await Promise.allSettled(initializationTasks.map(({ task }) => task()));

    results.forEach((result, index) => {
      const { name } = initializationTasks[index];
      if (result.status === 'fulfilled') {
        console.log(`${name} initialized successfully`);
      } else {
        console.error(`Failed to initialize ${name}:`, result.reason);
        throw new Error(`Failed to initialize ${name}`);
      }
    });

    app.listen(config.port, () => {
      console.log(`Server is running on port ${config.port}`);
    });
  } catch (error) {
    console.error("Failed to start the server:", error);
    process.exit(1);
  }
};

startServer();