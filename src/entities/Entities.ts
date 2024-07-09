import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Domain {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    domainName: string;

    @Column({ nullable: true })
    tld: string;

    @ManyToOne(() => Domain, domain => domain.subdomains, { nullable: true })
    parentDomain: Domain | null;

    @OneToMany(() => Domain, domain => domain.parentDomain)
    subdomains: Domain[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => WhoisRecord, whoisRecord => whoisRecord.domain)
    whoisRecords: WhoisRecord[];

    @OneToMany(() => DomainAnalysis, analysis => analysis.domain)
    analyses: DomainAnalysis[];

    @Column({
        type: "enum",
        enum: ["pending", "in_progress", "completed", "failed"],
        default: "pending"
      })
      analysisStatus: "pending" | "in_progress" | "completed" | "failed";
}

@Entity()
export class WhoisRecord {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Domain, domain => domain.whoisRecords)
    domain: Domain;

    @Column({ type: 'jsonb' })
    rawData: object;

    @Column({ nullable: true })
    registrar: string;

    @Column({ type: 'timestamp', nullable: true })
    creationDate: Date;

    @Column({ type: 'timestamp', nullable: true })
    expirationDate: Date;

    @Column({ type: 'timestamp', nullable: true })
    lastUpdateDate: Date;

    @CreateDateColumn()
    recordedAt: Date;
}

@Entity()
export class DomainAnalysis {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Domain, domain => domain.analyses)
    domain: Domain;

    @Column()
    analysisType: string; // e.g., 'virustotal', 'other_future_analysis'

    @Column({ type: 'jsonb' })
    rawData: object;

    @Column({ type: 'jsonb', nullable: true })
    lastAnalysisStats: object;

    @Column({ type: 'int', nullable: true })
    reputation: number;

    @Column({ type: 'timestamp' })
    analysisDate: Date;

    @CreateDateColumn()
    recordedAt: Date;
}

@Entity()
export class ApiRequest {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    apiType: string; // 'whois', 'virustotal', etc.

    @Column()
    domainName: string;

    @Column({ type: 'jsonb', nullable: true })
    response: object;

    @Column({ nullable: true })
    errorMessage: string;

    @CreateDateColumn()
    requestedAt: Date;
}

@Entity()
export class UserDomainAuthorization {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: number; // Assuming you have a separate User table

    @ManyToOne(() => Domain)
    domain: Domain;

    @Column()
    permissionLevel: string; // e.g., 'read', 'write', 'admin'

    @CreateDateColumn()
    grantedAt: Date;
}