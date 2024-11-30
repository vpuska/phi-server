import { IsString, IsPostalCode, IsIn, IsBoolean } from 'class-validator';
import { CreateBrandDto } from './brand.dto';
import { CreateDependantLimitDto } from './dependant-limit.dto';

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
    address2?: string;

    @IsString()
    address3?: string;

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

    @IsString()
    restrictionHint?: string;

    @IsString()
    restrictionParagraph?: string;

    @IsString()
    restrictionDetails?: string;

    @IsBoolean()
    stateALL: boolean = false;

    @IsBoolean()
    stateNSW: boolean = false;

    @IsBoolean()
    stateVIC: boolean = false;

    @IsBoolean()
    stateQLD: boolean = false;

    @IsBoolean()
    stateSA: boolean = false;

    @IsBoolean()
    stateWA: boolean = false;

    @IsBoolean()
    stateTAS: boolean = false;

    @IsBoolean()
    stateNT: boolean = false;

    @IsString()
    nonClassifiedDependantDescription: string = "";

    brands?: CreateBrandDto[];

    dependantLimits?: CreateDependantLimitDto[];
}