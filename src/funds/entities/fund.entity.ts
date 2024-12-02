import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
import { Brand } from './brand.entity';
import { DependantLimit } from './dependant-limit.entity';


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
    type: string; // Restricted or Open

    @Column({length:128, nullable:true})
    restrictionHint: string;

    @Column({length:128, nullable:true})
    restrictionParagraph: string;

    @Column({length:2048, nullable:true})
    restrictionDetails: string;

    @Column({default:false})
    stateALL: boolean;

    @Column({default:false})
    stateNSW: boolean;

    @Column({default:false})
    stateVIC: boolean;

    @Column({default:false})
    stateQLD: boolean;

    @Column({default:false})
    stateSA: boolean;

    @Column({default:false})
    stateWA: boolean;

    @Column({default:false})
    stateTAS: boolean;

    @Column({default:false})
    stateNT: boolean;

    @Column({length: 400, nullable:true})
    nonClassifiedDependantDescription: string;

    @OneToMany(() => Brand, (brand) => brand.fund, {
        cascade: true,
    })
    brands: Brand[];

    @OneToMany(() => DependantLimit, (dependantLimit) => dependantLimit.fund, {
        cascade: true,
    })
    dependantLimits: DependantLimit[];
}