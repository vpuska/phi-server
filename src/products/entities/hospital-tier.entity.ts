/**
 * products/entities/hospital-tier.entity.ts
 * ---
 * Store a ranking for each hospital tier so products can be selected on ranking
 * @author V.Puska
 * @date 14-Jan-25
 */
import { Entity, Column, PrimaryColumn } from 'typeorm';

/**
 * The **HospitalTier** table maps a ranking to each tier to allow searching for products on or
 * better than a particular tier.
 */
@Entity({name: 'hospital_tiers'})
export class HospitalTier {

    @PrimaryColumn({length:16})
    tier: string;

    @Column()
    ranking: number;
}