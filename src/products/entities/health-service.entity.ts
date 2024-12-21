import {Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, OneToMany} from 'typeorm';
import {Product} from "./product.entity";
import {BenefitsList} from "./benefits-list.entity";


@Entity({name: 'health-services'})
export class HealthService {

    @PrimaryColumn({length:64})
    productCode: string

    @PrimaryColumn({length:1})
    serviceType: string;

    @PrimaryColumn({length:32})
    serviceCode: string;

    @Column({length: 1})
    covered: string;

    @ManyToOne(() => Product, (product) => product.services, {
        createForeignKeyConstraints: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({name: "productCode"})
    product: Product;

    @OneToMany(() => BenefitsList, (benefitList) => benefitList.healthService, {
        cascade: true,
    })
    benefits: BenefitsList[];
}