/**
 * funds/entities/fund.entity.ts
 * ---
 */
import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity({name: 'funds'})
export class Fund {
    @PrimaryColumn({length:3})
    code: string;

    @Column({length:64})
    name: string;

    @Column({length:16, nullable:true})
    type: string; // Restricted or Open

    @Column({type: "text", nullable:true})
    xml: string;
}