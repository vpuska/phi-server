/**
 * products/entities/hospital-tier.entity.ts
 * ---
 * Store a ranking for each hospital tier so products can be selected on ranking
 * @author V.Puska
 */
import { Entity, Column, PrimaryColumn } from 'typeorm';


@Entity({name: 'hospital_tiers'})
export class HospitalTier {

    @PrimaryColumn({length:16})
    tier: string;

    @Column()
    ranking: number;
}