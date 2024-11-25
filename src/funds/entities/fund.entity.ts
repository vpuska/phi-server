import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity({name: 'funds'})
export class Fund {
    @PrimaryColumn({length:3})
    code: string;

    @Column({length:64})
    name: string;

    @Column({length:2048, nullable:true})
    description: string;

    @Column({length:64, nullable:true})
    address1: string;

    @Column({length:64, nullable:true})
    address2: string;

    @Column({length:64, nullable:true})
    address3: string;

    @Column({length:64, nullable:true})
    town: string;

    @Column({length:3, nullable:true})
    state: string;

    @Column({length:4, nullable:true})
    postcode: string;

    @Column({length:16, nullable:true})
    type: string;
}