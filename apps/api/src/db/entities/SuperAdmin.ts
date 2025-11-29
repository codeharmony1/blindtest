import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

@Entity({ name: "super_admins" })
export class SuperAdmin {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 255 })
  email!: string;

  @Column({ type: "varchar", length: 255 })
  password_hash!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  name?: string;

  @Column({ type: "datetime", nullable: true })
  last_login_at?: Date;

  @Column({ type: "boolean", default: true })
  is_active!: boolean;

  @Column({ type: "boolean", default: false })
  mfa_enabled!: boolean;

  @Column({ type: "varchar", length: 255, nullable: true })
  mfa_secret?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // Méthodes helper
  updateLastLogin(): void {
    this.last_login_at = new Date();
  }

  getDisplayName(): string {
    return this.name || this.email.split('@')[0];
  }
}
