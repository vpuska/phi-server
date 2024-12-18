import {Entity, Column, PrimaryColumn, ManyToOne, JoinColumn} from 'typeorm';
import {Fund} from "../../funds/entities/fund.entity";


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

    @Column({type:'int'})
    adultsCovered: number;

    @Column({type:'boolean'})
    childCover: boolean;

    @Column({type:'boolean'})
    studentCover: boolean;

    @Column({type:'boolean'})
    nonClassifiedCovered: boolean;

    @Column({type:'boolean'})
    nonStudentCover: boolean;

    @Column({type:'boolean'})
    conditionalNonStudentCover: boolean;

    @Column({type:'boolean'})
    disabilityCover: boolean;

    @Column({type:'integer'})
    excess: number;

    @Column({type:'integer'})
    excessPerAdmission: number;

    @Column({type:'integer'})
    excessPerPerson: number;

    @Column({type:'integer'})
    excessPerPolicy: number;

    @Column({type:'decimal'})
    premium: number;

    @Column({length:16})
    hospitalTier: string;

    @Column({ length:64})
    accommodationType: string;

}