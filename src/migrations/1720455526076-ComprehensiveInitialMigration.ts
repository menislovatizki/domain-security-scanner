import { MigrationInterface, QueryRunner } from "typeorm";

export class ComprehensiveInitialMigration1720455526076 implements MigrationInterface {
    name = 'ComprehensiveInitialMigration1720455526076'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."domain_analysisstatus_enum" AS ENUM('pending', 'in_progress', 'completed', 'failed')`);
        await queryRunner.query(`CREATE TABLE "domain" ("id" SERIAL NOT NULL, "domainName" character varying NOT NULL, "tld" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "analysisStatus" "public"."domain_analysisstatus_enum" NOT NULL DEFAULT 'pending', "parentDomainId" integer, CONSTRAINT "UQ_9746344d88b78b05a41f1efefcc" UNIQUE ("domainName"), CONSTRAINT "PK_27e3ec3ea0ae02c8c5bceab3ba9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "whois_record" ("id" SERIAL NOT NULL, "rawData" jsonb NOT NULL, "registrar" character varying, "creationDate" TIMESTAMP, "expirationDate" TIMESTAMP, "lastUpdateDate" TIMESTAMP, "recordedAt" TIMESTAMP NOT NULL DEFAULT now(), "domainId" integer, CONSTRAINT "PK_29b6bb095cd7bde808d755a2a83" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "domain_analysis" ("id" SERIAL NOT NULL, "analysisType" character varying NOT NULL, "rawData" jsonb NOT NULL, "lastAnalysisStats" jsonb, "reputation" integer, "analysisDate" TIMESTAMP NOT NULL, "recordedAt" TIMESTAMP NOT NULL DEFAULT now(), "domainId" integer, CONSTRAINT "PK_135fb15f8aaf9e997c622232eb4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "api_request" ("id" SERIAL NOT NULL, "apiType" character varying NOT NULL, "domainName" character varying NOT NULL, "response" jsonb, "errorMessage" character varying, "requestedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b3d35215ae13b22c62e9e4bb05b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_domain_authorization" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "permissionLevel" character varying NOT NULL, "grantedAt" TIMESTAMP NOT NULL DEFAULT now(), "domainId" integer, CONSTRAINT "PK_2ce58c8bcb5cada7f85a598b1fc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "domain" ADD CONSTRAINT "FK_004184e5dbe0a2977b1dcef5b41" FOREIGN KEY ("parentDomainId") REFERENCES "domain"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "whois_record" ADD CONSTRAINT "FK_29d5408bcbe193ea3da37fb371e" FOREIGN KEY ("domainId") REFERENCES "domain"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "domain_analysis" ADD CONSTRAINT "FK_c5be0c1c907fa6a4d4d17caeb45" FOREIGN KEY ("domainId") REFERENCES "domain"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_domain_authorization" ADD CONSTRAINT "FK_89d8b3ebfdcd8397b0f5b933d4b" FOREIGN KEY ("domainId") REFERENCES "domain"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_domain_authorization" DROP CONSTRAINT "FK_89d8b3ebfdcd8397b0f5b933d4b"`);
        await queryRunner.query(`ALTER TABLE "domain_analysis" DROP CONSTRAINT "FK_c5be0c1c907fa6a4d4d17caeb45"`);
        await queryRunner.query(`ALTER TABLE "whois_record" DROP CONSTRAINT "FK_29d5408bcbe193ea3da37fb371e"`);
        await queryRunner.query(`ALTER TABLE "domain" DROP CONSTRAINT "FK_004184e5dbe0a2977b1dcef5b41"`);
        await queryRunner.query(`DROP TABLE "user_domain_authorization"`);
        await queryRunner.query(`DROP TABLE "api_request"`);
        await queryRunner.query(`DROP TABLE "domain_analysis"`);
        await queryRunner.query(`DROP TABLE "whois_record"`);
        await queryRunner.query(`DROP TABLE "domain"`);
        await queryRunner.query(`DROP TYPE "public"."domain_analysisstatus_enum"`);
    }

}
