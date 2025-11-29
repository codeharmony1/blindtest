import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

@Entity({ name: "password_reset_tokens" })
export class PasswordResetToken {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  email!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 255 })
  token!: string;

  @Column({ type: "datetime" })
  expires_at!: Date;

  @Column({ type: "boolean", default: false })
  used!: boolean;

  @Column({ type: "datetime", nullable: true })
  used_at?: Date;

  @CreateDateColumn()
  created_at!: Date;

  // Méthodes helper
  isExpired(): boolean {
    return new Date() > this.expires_at;
  }

  isValid(): boolean {
    return !this.used && !this.isExpired();
  }

  markAsUsed(): void {
    this.used = true;
    this.used_at = new Date();
  }
}
