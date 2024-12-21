import {Entity, Column, PrimaryColumn, ManyToOne, JoinColumn} from 'typeorm';
import {HealthService} from "./health-service.entity";

@Entity({name: 'benefits-list'})
export class BenefitsList {

    @PrimaryColumn({length:64})
    productCode: string;

    @PrimaryColumn({length:1})
    serviceType: string;

    @PrimaryColumn({length:32})
    serviceCode: string

    @PrimaryColumn({length:3})
    state: string

    @PrimaryColumn({length:32})
    itemCode: string;

    @Column({length:16})
    benefitType: string;

    @Column({type:"decimal"})
    benefitAmount: number;

    @ManyToOne(() => HealthService, (healthService) => healthService.benefits, {
        createForeignKeyConstraints: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn([
        {name: "productCode", referencedColumnName: "productCode"},
        {name: "serviceType", referencedColumnName: "serviceType"},
        {name: "serviceCode", referencedColumnName: "serviceCode"},
    ])
    healthService: HealthService;
}