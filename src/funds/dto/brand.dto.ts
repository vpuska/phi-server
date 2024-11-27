import {IsString} from 'class-validator';


export class CreateBrandDto {
    @IsString()
    code: string;

    @IsString()
    name: string;

    @IsString()
    phone?: string;

    @IsString()
    email?: string;

    @IsString()
    website?: string;
}