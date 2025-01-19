import { IsBoolean, IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';


const HOSPITAL_TIERS = [
    "Basic", "BasicPlus", "Bronze", "BronzePlus", "Silver", "SilverPlus", "Gold"
];

const STATES = [
    "NSW", "ACT", "VIC", "QLD", "TAS", "SA", "WA", "NT"
]


/**
 * product-search.dto.ts
 * ---
 * Parameters for product search
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
    childCover : boolean = false;

    @ApiProperty({
        type: Boolean,
        required: false,
        default: false,
        description: "Only include products with *student* dependant cover."
    })
    @IsBoolean()
    studentCover : boolean = false;

    @ApiProperty({
        type: Boolean,
        required: false,
        default: false,
        description: "Only include products with *non-student* dependant cover."
    })
    @IsBoolean()
    nonStudentCover : boolean = false;

    @ApiProperty({
        type: Boolean,
        required: false,
        default: false,
        description: "Only include products with *conditional non-student* dependant cover."
    })
    @IsBoolean()
    conditionalNonStudentCover : boolean = false;

    @ApiProperty({
        type: Boolean,
        required: false,
        default: false,
        description: "Only include products with *non-classified* dependant cover."
    })
    @IsBoolean()
    nonClassifiedCover : boolean = false;

    @ApiProperty({
        type: Boolean,
        required: false,
        default: false,
        description: "Only include products with *disabled* dependant cover."
    })
    @IsBoolean()
    disabilityCover : boolean = false;


}