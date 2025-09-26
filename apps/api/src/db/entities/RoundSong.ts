import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";
import { Round } from "./Round";
import { Answer } from "./Answer";

export type SongMode = "prepared" | "freestyle";
export type SongStatus = "pending" | "open" | "closed" | "scored";

@Entity({ name: "round_songs" })
@Index("uq_roundsong_position", ["round_id", "idx"], { unique: true })
export class RoundSong {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ type: "bigint", unsigned: true })
  round_id!: string;

  @ManyToOne(() => Round, (r) => r.songs, { onDelete: "CASCADE" })
  @JoinColumn({ name: "round_id" })
  round!: Round;

  @Column({ type: "smallint", unsigned: true })
  idx!: number;

  @Column({
    type: "enum",
    enum: ["prepared", "freestyle"],
    default: "prepared",
  })
  mode!: SongMode;

  @Column({ type: "varchar", length: 255, nullable: true })
  title_official!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  artist_official!: string | null;

  @Column({ type: "longtext", nullable: true })
  aliases_json?: string;

  @Column({ type: "smallint", unsigned: true, nullable: true })
  duration_s!: number | null;

  @Column({
    type: "enum",
    enum: ["pending", "open", "closed", "scored"],
    default: "pending",
  })
  status!: SongStatus;

  @Column({ type: "datetime", nullable: true })
  started_at!: Date | null;

  @Column({ type: "datetime", nullable: true })
  ended_at!: Date | null;

  @CreateDateColumn()
  created_at!: Date;

  @OneToMany(() => Answer, (a) => a.song)
  answers!: Answer[];
}
