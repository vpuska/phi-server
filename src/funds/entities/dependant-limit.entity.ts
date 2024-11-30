import { Entity, Column, PrimaryColumn, ManyToOne } from 'typeorm';
import { Fund } from './fund.entity';

@Entity({name: 'dependant_limits'})
export class DependantLimit {

    @PrimaryColumn({length:3})
    fundCode: string;

    @PrimaryColumn({length:32})
    type: string;

    @Column({default:false})
    supported: boolean;

    @Column({type:'integer', default:0})
    minAge: number;

    @Column({type:'integer', default:0})
    maxAge: number;

    @ManyToOne(() => Fund, (fund) => fund.dependantLimits, {
        createForeignKeyConstraints: true,
        onDelete: 'CASCADE',
    })
    fund: Fund;
}