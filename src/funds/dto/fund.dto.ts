import {IsString, IsPostalCode, IsIn} from 'class-validator';
import { CreateBrandDto } from './brand.dto';


export class CreateFundDto {
    @IsString()
    code: string;

    @IsString()
    name: string;

    @IsString()
    description: string;

    @IsString()
    address1: string;

    @IsString()
    address2: string;

    @IsString()
    address3: string;

    @IsString()
    town: string;

    @IsString()
    @IsIn(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"])
    state: string;

    @IsString()
    @IsPostalCode("AU")
    postcode: string;

    @IsString()
    @IsIn(["Open", "Restricted"])
    type: string;

    brands?: CreateBrandDto[];
}