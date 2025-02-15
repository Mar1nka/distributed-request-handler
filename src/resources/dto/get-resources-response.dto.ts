import { Resource } from '../schemas/resource.schema';

export class GetResourcesResponseDto {
  total: number;
  page: number;
  limit: number;
  data: Resource[];
}
