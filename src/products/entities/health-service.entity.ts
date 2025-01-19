/**
 * products/entities/health-service.entity.ts
 * ---
 * @author V.Puska
 * @date 08-Jan-2025
 */
import { Entity, Column, PrimaryColumn, Index } from 'typeorm';

/**
 * **HealthService** is a map between a health service, Eg. "Dental", and a three-character mnemonic which
 * is stored in the product record and used for searching.
 */
@Entity({name: 'health_services'})
@Index(["serviceType", "serviceCode"], {unique:true})
export class HealthService {

    @PrimaryColumn({length:3})
    key: string;

    @Column({length:1})
    serviceType: string;

    @PrimaryColumn({length:32})
    serviceCode: string;

}