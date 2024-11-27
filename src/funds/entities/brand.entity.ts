import { Entity, Column, PrimaryColumn, ManyToOne } from 'typeorm';
import { Fund } from './fund.entity';

@Entity({name: 'brands'})
export class Brand {

    @PrimaryColumn({length:5})
    code: string;

    @ManyToOne(
        () => Fund,
        (fund) => fund.brands,
        {
            createForeignKeyConstraints: true,
            onDelete: 'CASCADE',
    })
    fund: Fund;

    @Column({length:64})
    name: string;

    @Column({length:2048, nullable:true})
    phone: string;

    @Column({length:64, nullable:true})
    email: string;

    @Column({length:64, nullable:true})
    website: string;
}