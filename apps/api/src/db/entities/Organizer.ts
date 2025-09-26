import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Index,
} from "typeorm";
import { Event } from "./Event";
import { EventStaff } from "./EventStaff";

@Entity({ name: "organizers" })
export class Organizer {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 255 })
  email!: string;

  @Column({ type: "varchar", length: 255 })
  password_hash!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  display_name?: string;

  @CreateDateColumn()
  created_at!: Date;

  @OneToMany(() => Event, (e) => e.organizer)
  events!: Event[];

  @OneToMany(() => EventStaff, (es) => es.organizer)
  staff!: EventStaff[];
}
