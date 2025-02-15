import { ResourceStatus } from '../resources.enum';

export interface CreateResourceResponseDto {
  id: string;
  url: string;
  status: ResourceStatus;
  httpCode: string | null;
}
