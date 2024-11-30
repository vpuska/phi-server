import { IsString, IsBoolean, IsInt } from 'class-validator';

export class CreateDependantLimitDto {

    @IsString()
    type: string

    @IsBoolean()
    supported: boolean;

    @IsInt()
    minAge: number;

    @IsInt()
    maxAge: number;
}