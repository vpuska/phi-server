import { Entity, Column, PrimaryColumn, Index } from 'typeorm';


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