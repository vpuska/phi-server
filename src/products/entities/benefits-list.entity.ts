import {Entity, Column, PrimaryColumn, ManyToOne, JoinColumn} from 'typeorm';
import {Product} from "./product.entity";

@Entity({name: 'benefits-list'})
export class BenefitsList {

    @PrimaryColumn({length:64})
    productCode: string;

    @PrimaryColumn({length:32})
    serviceKey: string

    @PrimaryColumn({length:3})
    state: string

    @PrimaryColumn({length:32})
    itemCode: string;

    @Column({length:16})
    benefitType: string;

    @Column({type:"decimal"})
    benefitAmount: number;

    @ManyToOne(() => Product, (product) => product.benefitLimits, {
        createForeignKeyConstraints: true,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        orphanedRowAction: 'delete'
    })
    @JoinColumn([
        {name: "productCode", referencedColumnName: "code"}
    ])
    product: Product;
}