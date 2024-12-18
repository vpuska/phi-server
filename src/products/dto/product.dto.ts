import {IsString, IsIn, IsBoolean, IsUrl, IsInt, IsDecimal} from 'class-validator';

export class CreateProductDto {
    @IsString()
    code: string;

    @IsString()
    fundCode: string;

    @IsString()
    name: string;

    @IsString()
    @IsIn(["Hospital", "GeneralHealth", "Combined"])
    type: string;

    @IsUrl()
    productURL: string;

    @IsUrl()
    phisURL: string;

    @IsString()
    @IsIn(["Open", "Closed"])
    status: string;

    @IsString()
    @IsIn(["ALL", "NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"])
    state: string;

    @IsInt()
    adultsCovered: number;

    @IsBoolean()
    childCover?: boolean = false;

    @IsBoolean()
    studentCover?: boolean = false;

    @IsBoolean()
    nonClassifiedCovered?: boolean = false;

    @IsBoolean()
    nonStudentCover?: boolean = false;

    @IsBoolean()
    conditionalNonStudentCover?: boolean = false;

    @IsBoolean()
    disabilityCover?: boolean = false;

    @IsInt()
    excess?: number = 0;

    @IsInt()
    excessPerAdmission?: number = 0;

    @IsInt()
    excessPerPerson?: number = 0;

    @IsInt()
    excessPerPolicy?: number = 0;

    @IsDecimal()
    premium?: number = 0;

    @IsString()
    @IsIn(["Gold", "Silver", "SilverPlus", "Bronze", "BronzePlus", "BasicPlus", "Basic"])
    hospitalTier?: string;

    @IsString()
    @IsIn(["PrivateOrPublic", "PrivateSharedPublic", "PrivateSharedPublicShared", "Public", "PublicShared", "PrivatePublicShared"])
    accommodationType?: string;
}