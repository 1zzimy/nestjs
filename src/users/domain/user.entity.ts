import { BaseTimeEntity } from "src/common/entities/base-time.entity";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class User extends BaseTimeEntity{
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ unique: true })
    email: string;

    @Column({ select: false })
    pwd: string;

    @Column({default: true})
    isActive: boolean;
}