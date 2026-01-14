/**
 * funds/entities/fund-brand.entity.ts
 * ---
 * @author V Puska
 * @date 14-Jan-2026
 */
import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity({name: 'funds_brands'})
export class FundBrand {
    @PrimaryColumn({length:5})
    code: string;

    @Column({length:64})
    name: string;

    @Column({length:32})
    shortName: string;

    @Column({length:16, nullable:true})
    type: string; // Restricted or Open
}