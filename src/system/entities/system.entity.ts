/**
 * system/entities/system.entity.ts
 * ---
 * @author V.Puska
 * @date: 05-Jan-25
 */
import { Entity, Column, PrimaryColumn} from 'typeorm';


/**
 * System entity.
 */
@Entity({name: 'system'})
export class System {
    @PrimaryColumn({length:64})
    key1: string;

    @PrimaryColumn({length:256, default: ""})
    key2: string;

    @Column({length:256})
    data: string;
}