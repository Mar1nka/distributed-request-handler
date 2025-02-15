import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { CreateResourceRequestDto } from './dto/create-resource-request.dto';
import { GetResourcesRequestDto } from './dto/get-resources-request.dto';
import { CreateResourceResponseDto } from './dto/create-resource-response.dto';
import { GetResourcesResponseDto } from './dto/get-resources-response.dto';

@Controller('api/resources')
export class ResourcesController {
  constructor(private readonly requestsService: ResourcesService) {}

  @Post()
  async createResourceRequests(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    createResourceRequestDto: CreateResourceRequestDto,
  ): Promise<CreateResourceResponseDto> {
    return this.requestsService.createResource(createResourceRequestDto);
  }

  @Get()
  async getResourceRequestsList(
    @Query(new ValidationPipe({ transform: true }))
    query: GetResourcesRequestDto,
  ): Promise<GetResourcesResponseDto> {
    return this.requestsService.getResourceRequestsList(query);
  }
}
