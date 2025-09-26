import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { Event } from "./Event";
import { RoundSong } from "./RoundSong";

@Entity({ name: "rounds" })
export class Round {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ type: "bigint", unsigned: true })
  event_id!: string;

  @ManyToOne(() => Event, (e) => e.rounds, { onDelete: "CASCADE" })
  @JoinColumn({ name: "event_id" })
  event!: Event;

  @Column({ type: "varchar", length: 255, nullable: true })
  name!: string | null;

  @Column({ type: "smallint", unsigned: true, default: 15 })
  default_duration_s!: number;

  @Column({ type: "smallint", unsigned: true, default: 20 })
  total_songs!: number;

  @CreateDateColumn()
  created_at!: Date;

  @OneToMany(() => RoundSong, (rs) => rs.round)
  songs!: RoundSong[];
}
