import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { SuperAdmin } from "./SuperAdmin";

export type AuditAction =
  | "login"
  | "logout"
  | "create_tenant"
  | "update_tenant"
  | "suspend_tenant"
  | "reactivate_tenant"
  | "delete_tenant"
  | "update_plan"
  | "stop_event"
  | "force_stop_event"
  | "take_dj_control"
  | "impersonate_tenant"
  | "exit_impersonation";

export type TargetType = "tenant" | "event" | "session" | "user" | "system";

@Entity({ name: "audit_logs" })
export class AuditLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => SuperAdmin, { onDelete: "SET NULL" })
  @JoinColumn({ name: "admin_id" })
  admin?: SuperAdmin;

  @Column({ type: "varchar", length: 36, nullable: true })
  admin_id?: string;

  @Column({
    type: "enum",
    enum: [
      "login",
      "logout",
      "create_tenant",
      "update_tenant",
      "suspend_tenant",
      "reactivate_tenant",
      "delete_tenant",
      "update_plan",
      "stop_event",
      "force_stop_event",
      "take_dj_control",
      "impersonate_tenant",
      "exit_impersonation",
    ],
  })
  action!: AuditAction;

  @Column({
    type: "enum",
    enum: ["tenant", "event", "session", "user", "system"],
    nullable: true,
  })
  target_type?: TargetType;

  @Column({ type: "varchar", length: 36, nullable: true })
  target_id?: string;

  @Column({ type: "longtext", nullable: true })
  metadata_json?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  ip_address?: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  user_agent?: string;

  @CreateDateColumn()
  timestamp!: Date;

  // Index pour recherche optimisée
  @Index("idx_audit_admin", ["admin_id", "timestamp"])
  static adminTimestamp: any;

  @Index("idx_audit_action", ["action", "timestamp"])
  static actionTimestamp: any;

  @Index("idx_audit_target", ["target_type", "target_id"])
  static target: any;

  // Méthodes helper
  getMetadata(): Record<string, any> {
    try {
      return this.metadata_json ? JSON.parse(this.metadata_json) : {};
    } catch {
      return {};
    }
  }

  setMetadata(metadata: Record<string, any>): void {
    this.metadata_json = JSON.stringify(metadata);
  }

  static create(data: {
    adminId?: string;
    action: AuditAction;
    targetType?: TargetType;
    targetId?: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): AuditLog {
    const log = new AuditLog();
    log.admin_id = data.adminId;
    log.action = data.action;
    log.target_type = data.targetType;
    log.target_id = data.targetId;
    log.ip_address = data.ipAddress;
    log.user_agent = data.userAgent;
    if (data.metadata) {
      log.setMetadata(data.metadata);
    }
    return log;
  }
}
