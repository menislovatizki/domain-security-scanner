import { AppDataSource } from "../data-source";

export const getDatabaseConnection = async () => {
  if (!AppDataSource.isInitialized) {
    try {
      await AppDataSource.initialize();
      console.log("Data Source has been initialized!");
    } catch (error) {
      console.error("Error during Data Source initialization:", error);
    }
  }
  return AppDataSource;
};

