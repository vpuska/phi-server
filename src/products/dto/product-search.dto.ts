import { IsBoolean, IsIn, IsInt, IsString } from 'class-validator';

/**
 * product-search.dto.ts
 * ---
 * Parameters for product search
 */
export class ProductSearchDto {
    @IsInt()
    @IsIn([
        0, 1, 2
    ])
    numberOfAdults: number;

    @IsBoolean()
    hospitalCover: boolean;

    @IsBoolean()
    generalCover: boolean;

    @IsBoolean()
    childCover : boolean;

    @IsBoolean()
    studentCover : boolean;

    @IsBoolean()
    nonStudentCover : boolean;

    @IsBoolean()
    conditionalNonStudentCover : boolean;

    @IsBoolean()
    nonClassifiedCover : boolean;

    @IsBoolean()
    disabilityCover : boolean;

    @IsString()
    @IsIn([
        "None", "Basic", "BasicPlus", "Bronze", "BronzePlus", "Silver", "SilverPlus", "Gold"
    ])
    hospitalTier: string;

    @IsString()
    @IsIn([
        "NSW", "ACT", "VIC", "QLD", "TAS", "SA", "WA", "NT"
    ])
    state: string;
}