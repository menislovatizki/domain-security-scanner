import { DataSource } from "typeorm";
import {
  Domain,
  WhoisRecord,
  DomainAnalysis,
  ApiRequest,
  UserDomainAuthorization,
} from "./entities/Entities";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.POSTGRES_USER || "admin",
  password: process.env.POSTGRES_PASSWORD || "reflectiz",
  database: process.env.POSTGRES_DB || "domainscanner",
  synchronize: false,
  logging: true,
  entities: [Domain, WhoisRecord, DomainAnalysis, ApiRequest, UserDomainAuthorization],
  migrations: ["dist/migrations/*.js"],
  subscribers: [],
});