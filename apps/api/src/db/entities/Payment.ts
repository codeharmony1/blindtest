import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
  JoinColumn,
} from "typeorm";
import { Tenant } from "./Tenant";
import { TenantSession } from "./TenantSession";

export type PaymentType = 'SUBSCRIPTION' | 'SESSION' | 'ADDON';
export type PaymentMethod = 'STRIPE' | 'PAYPAL' | 'BANK_TRANSFER' | 'OTHER';
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

@Entity({ name: "payments" })
export class Payment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id" })
  tenant!: Tenant;

  @Column({ type: "varchar", length: 36 })
  tenant_id!: string;

  @ManyToOne(() => TenantSession, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "session_id" })
  session?: TenantSession;

  @Column({ type: "varchar", length: 36, nullable: true })
  session_id?: string;

  // Type de paiement
  @Column({
    type: "enum",
    enum: ['SUBSCRIPTION', 'SESSION', 'ADDON'],
    default: 'SESSION'
  })
  payment_type!: PaymentType;

  @Column({
    type: "enum",
    enum: ['STRIPE', 'PAYPAL', 'BANK_TRANSFER', 'OTHER'],
    default: 'STRIPE'
  })
  payment_method!: PaymentMethod;

  // Statut et montant
  @Column({
    type: "enum",
    enum: ['PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED'],
    default: 'PENDING'
  })
  status!: PaymentStatus;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: "varchar", length: 3, default: 'EUR' })
  currency!: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  tax_amount?: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  discount_amount?: number;

  // Références externes
  @Column({ type: "varchar", length: 255, nullable: true })
  stripe_payment_intent_id?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  stripe_checkout_session_id?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  external_transaction_id?: string;

  // Métadonnées de facturation
  @Column({ type: "varchar", length: 500, nullable: true })
  billing_address?: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  billing_country?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  billing_email?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  customer_name?: string;

  // Description et métadonnées
  @Column({ type: "varchar", length: 500 })
  description!: string;

  @Column({ type: "longtext", nullable: true })
  metadata_json?: string;

  // Dates importantes
  @Column({ type: "datetime", nullable: true })
  paid_at?: Date;

  @Column({ type: "datetime", nullable: true })
  failed_at?: Date;

  @Column({ type: "datetime", nullable: true })
  refunded_at?: Date;

  @Column({ type: "text", nullable: true })
  failure_reason?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // Index pour optimisation
  @Index("idx_tenant_payments", ["tenant_id", "status", "created_at"])
  static tenantPayments: any;

  @Index("idx_payment_external", ["stripe_payment_intent_id"])
  static paymentExternal: any;

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

  isPaid(): boolean {
    return this.status === 'PAID';
  }

  isFailed(): boolean {
    return this.status === 'FAILED';
  }

  isPending(): boolean {
    return this.status === 'PENDING' || this.status === 'PROCESSING';
  }

  isRefunded(): boolean {
    return this.status === 'REFUNDED';
  }

  markAsPaid(): void {
    this.status = 'PAID';
    this.paid_at = new Date();
  }

  markAsFailed(reason?: string): void {
    this.status = 'FAILED';
    this.failed_at = new Date();
    if (reason) {
      this.failure_reason = reason;
    }
  }

  markAsRefunded(): void {
    this.status = 'REFUNDED';
    this.refunded_at = new Date();
  }

  getTotalAmount(): number {
    return this.amount + (this.tax_amount || 0) - (this.discount_amount || 0);
  }

  getDisplayAmount(): string {
    const total = this.getTotalAmount();
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: this.currency
    }).format(total);
  }
}