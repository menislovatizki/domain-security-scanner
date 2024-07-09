import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatedComprehensiveInitialMigration1720455526077 implements MigrationInterface {
    name = 'UpdatedComprehensiveInitialMigration1720455526077'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop existing tables
        await queryRunner.query(`DROP TABLE IF EXISTS "user_domain_authorization" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "api_request" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "domain_analysis" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "whois_record" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "domain" CASCADE`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."domain_analysisstatus_enum"`);

        // Recreate enum
        await queryRunner.query(`CREATE TYPE "public"."domain_analysisstatus_enum" AS ENUM('pending', 'in_progress', 'completed', 'failed')`);

        // Recreate tables with updated structures
        await queryRunner.query(`CREATE TABLE "domain" (
            "id" SERIAL NOT NULL, 
            "domainName" character varying NOT NULL, 
            "tld" character varying, 
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), 
            "analysisStatus" "public"."domain_analysisstatus_enum" NOT NULL DEFAULT 'pending', 
            "parentDomainId" integer, 
            CONSTRAINT "UQ_9746344d88b78b05a41f1efefcc" UNIQUE ("domainName"), 
            CONSTRAINT "PK_27e3ec3ea0ae02c8c5bceab3ba9" PRIMARY KEY ("id")
        )`);

        await queryRunner.query(`CREATE TABLE "domain_analysis" (
            "id" SERIAL NOT NULL, 
            "analysisType" character varying NOT NULL, 
            "rawData" jsonb NOT NULL, 
            "lastAnalysisStats" jsonb, 
            "reputation" integer, 
            "analysisDate" TIMESTAMP NOT NULL, 
            "recordedAt" TIMESTAMP NOT NULL DEFAULT now(), 
            "domainId" integer, 
            CONSTRAINT "PK_135fb15f8aaf9e997c622232eb4" PRIMARY KEY ("id")
        )`);

        await queryRunner.query(`CREATE TABLE "request_log" (
            "id" SERIAL NOT NULL, 
            "requestType" character varying NOT NULL, 
            "domainName" character varying NOT NULL, 
            "requestData" jsonb, 
            "requestedAt" TIMESTAMP NOT NULL DEFAULT now(), 
            CONSTRAINT "PK_request_log" PRIMARY KEY ("id")
        )`);

        // Add foreign key constraints
        await queryRunner.query(`ALTER TABLE "domain" ADD CONSTRAINT "FK_004184e5dbe0a2977b1dcef5b41" FOREIGN KEY ("parentDomainId") REFERENCES "domain"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "domain_analysis" ADD CONSTRAINT "FK_c5be0c1c907fa6a4d4d17caeb45" FOREIGN KEY ("domainId") REFERENCES "domain"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove foreign key constraints
        await queryRunner.query(`ALTER TABLE "domain_analysis" DROP CONSTRAINT "FK_c5be0c1c907fa6a4d4d17caeb45"`);
        await queryRunner.query(`ALTER TABLE "domain" DROP CONSTRAINT "FK_004184e5dbe0a2977b1dcef5b41"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "request_log"`);
        await queryRunner.query(`DROP TABLE "domain_analysis"`);
        await queryRunner.query(`DROP TABLE "domain"`);

        // Drop enum
        await queryRunner.query(`DROP TYPE "public"."domain_analysisstatus_enum"`);
    }
}