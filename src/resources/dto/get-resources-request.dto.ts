import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

import { ResourceStatus } from '../resources.enum';

export class GetResourcesRequestDto {
  @IsOptional()
  @IsEnum(ResourceStatus)
  status?: ResourceStatus;

  @IsOptional()
  @Transform(({ value }) => {
    const page: number = Number(value);
    return Number.isNaN(page) ? undefined : page;
  })
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => {
    const limit: number = Number(value);
    return Number.isNaN(limit) ? undefined : limit;
  })
  @IsInt()
  @Min(1)
  limit?: number;
}
