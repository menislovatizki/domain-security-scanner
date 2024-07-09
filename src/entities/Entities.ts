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
export class DomainAnalysis {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Domain, domain => domain.analyses)
    domain: Domain;

    @Column()
    analysisType: string; // e.g., 'virustotal', 'whois'

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
export class RequestLog {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    requestType: string; // 'scan', 'analysis', etc.

    @Column()
    domainName: string;

    @Column({ type: 'jsonb', nullable: true })
    requestData: object;

    @CreateDateColumn()
    requestedAt: Date;
}