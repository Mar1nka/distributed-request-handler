import { ResourceStatus } from '../resources.enum';

export class GetResourcesResponseDto {
  total: number;
  page: number;
  limit: number;
  data: ResourcesResponseDto[];
}

export class ResourcesResponseDto {
  id: string;
  url: string;
  status: ResourceStatus;
  httpCode: string | null;
}
