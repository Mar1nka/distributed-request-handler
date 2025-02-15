import { IsString, IsUrl, IsNotEmpty } from 'class-validator';

export class CreateResourceRequestDto {
  @IsUrl()
  @IsString()
  @IsNotEmpty()
  url: string;
}
