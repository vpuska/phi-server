import {Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, OneToMany} from 'typeorm';
import {Fund} from "../../funds/entities/fund.entity";
import { DependantLimit } from '../../funds/entities/dependant-limit.entity';
import { BenefitsList } from './benefits-list.entity';


@Entity({name: 'products'})
export class Product {
    @PrimaryColumn({length:16})
    code: string;

    @Column({length:5})
    fundCode: string;

    @ManyToOne(() => Fund, (fund) => fund.code, {
        createForeignKeyConstraints: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({name:'fundCode'})
    fund: Fund;

    @Column({length:64})
    name: string;

    @Column({length:16})
    type: string;  // Hospital, GeneralHealth, Combined

    @Column({length:512, nullable:true})
    productURL: string;

    @Column({length:512, nullable:true})
    phisURL: string;

    @Column({length:8})
    status: string;  // Open, Closed

    @Column({length:3})
    state: string;

    @Column({type:'int', default:0})
    adultsCovered: number;

    @Column({type:'boolean', default: false})
    childCover: boolean;

    @Column({type:'boolean', default: false})
    studentCover: boolean;

    @Column({type:'boolean', default: false})
    nonClassifiedCovered: boolean;

    @Column({type:'boolean', default: false})
    nonStudentCover: boolean;

    @Column({type:'boolean', default: false})
    conditionalNonStudentCover: boolean;

    @Column({type:'boolean', default: false})
    disabilityCover: boolean;

    @Column({type:'integer', default:0})
    excess: number;

    @Column({type:'integer', default:0})
    excessPerAdmission: number;

    @Column({type:'integer', default:0})
    excessPerPerson: number;

    @Column({type:'integer', default:0})
    excessPerPolicy: number;

    @Column({type:'decimal', default:0})
    premium: number;

    @Column({length:16, nullable:true})
    hospitalTier: string;

    @Column({ length:64, nullable:true})
    accommodationType: string;

    @Column({length:512})
    services: string;

    @OneToMany(() => BenefitsList, (benefit) => benefit.product, {
        cascade: true,
    })
    benefitLimits: BenefitsList[];

}