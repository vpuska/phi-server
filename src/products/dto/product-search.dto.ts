/**
 * product-search.dto.ts
 * ---
 * @author V Puska
 * @date 15-Jan-2025
 */

import { IsBoolean, IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';


const HOSPITAL_TIERS = [
    "Basic", "BasicPlus", "Bronze", "BronzePlus", "Silver", "SilverPlus", "Gold"
];

const STATES = [
    "NSW", "ACT", "VIC", "QLD", "TAS", "SA", "WA", "NT"
]

/**
 * ProductSearchDto - body for the products search API.
 */
export class ProductSearchDto {

    @ApiProperty({
        type: String,
        required: true,
        enum: STATES,
        description: "State of residence."
    })
    @IsString()
    @IsIn(STATES)
    state: "NSW" | "ACT" | "VIC" | "QLD" | "TAS" | "SA" | "WA" | "NT";

    @ApiProperty({
        type: Number,
        required: true,
        enum: [0, 1, 2],
        description: "Number of adults to be covered by the product."
    })
    @IsInt()
    @IsIn([0, 1, 2])
    numberOfAdults: number;

    @ApiProperty({
        type: Boolean,
        required: true,
        description: "Search for *hospital* products."
    })
    @IsBoolean()
    hospitalCover: boolean;

    @ApiProperty({
        type: Boolean,
        required: true,
        description: "Search for *General Medical* products."
    })
    @IsBoolean()
    generalCover: boolean;

    @ApiProperty({
        type: String,
        required: false,
        description: "Select the minimum tier for *Hospital* products.",
        enum: HOSPITAL_TIERS
    })
    @IsString()
    @IsIn(HOSPITAL_TIERS)
    @IsOptional()
    hospitalTier?: string;

    @ApiProperty({
        type: Boolean,
        required: false,
        default: false,
        description: "Only include products with *child* dependant cover."
    })
    @IsBoolean()
    @IsOptional()
    childCover? : boolean;

    @ApiProperty({
        type: Boolean,
        required: false,
        default: false,
        description: "Only include products with *student* dependant cover."
    })
    @IsBoolean()
    @IsOptional()
    studentCover? : boolean;

    @ApiProperty({
        type: Boolean,
        required: false,
        default: false,
        description: "Only include products with *young adult* dependant cover."
    })
    @IsBoolean()
    @IsOptional()
    youngAdultCover? : boolean;

    @ApiProperty({
        type: Boolean,
        required: false,
        default: false,
        description: "Only include products with *disabled* dependant cover."
    })
    @IsBoolean()
    @IsOptional()
    disabilityCover? : boolean;


}