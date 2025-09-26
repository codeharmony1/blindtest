import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
} from "typeorm";
import { Organizer } from "./Organizer";
import { EventStaff } from "./EventStaff";
import { Team } from "./Team";
import { Round } from "./Round";

@Entity({ name: "events" })
export class Event {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @ManyToOne(() => Organizer, (o) => o.events, { onDelete: "CASCADE" })
  @JoinColumn({ name: "organizer_id" })
  organizer!: Organizer;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 16 })
  code!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "longtext", nullable: true })
  settings_json?: string; // JSON string

  @CreateDateColumn()
  created_at!: Date;

  @OneToMany(() => EventStaff, (es) => es.event)
  staff!: EventStaff[];

  @OneToMany(() => Team, (t) => t.event)
  teams!: Team[];

  @OneToMany(() => Round, (r) => r.event)
  rounds!: Round[];
}
