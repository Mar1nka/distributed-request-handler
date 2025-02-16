import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { HttpService } from '@nestjs/axios';

import { Resource } from './schemas/resource.schema';
import { CreateResourceRequestDto } from './dto/create-resource-request.dto';
import { ResourceStatus } from './resources.enum';
import { GetResourcesRequestDto } from './dto/get-resources-request.dto';
import {
  RESOURCES_DB_COLLECTION_NAME,
  RESOURCES_QUEUE,
} from './resources.constants';
import { CreateResourceResponseDto } from './dto/create-resource-response.dto';
import {
  GetResourcesResponseDto,
  ResourcesResponseDto,
} from './dto/get-resources-response.dto';
import { ResourcesGateway } from './resources.gateway';

interface ResourcesFilter {
  status?: ResourceStatus;
}

@Injectable()
export class ResourcesService {
  constructor(
    @InjectModel(RESOURCES_DB_COLLECTION_NAME)
    private readonly resourceModel: Model<Resource>,
    @InjectQueue(RESOURCES_QUEUE)
    private readonly queue: Queue,
    private readonly httpService: HttpService,
    private readonly resourcesGateway: ResourcesGateway,
  ) {}

  async createResource(
    createResourceDto: CreateResourceRequestDto,
  ): Promise<CreateResourceResponseDto> {
    let createdResource: Resource = new this.resourceModel({
      status: ResourceStatus.NEW,
      url: createResourceDto.url,
    });

    createdResource = await createdResource.save();

    await this.queue.add(createdResource._id.toString(), {
      url: createdResource.url,
      id: createdResource._id.toString(),
    });

    return {
      id: createdResource._id.toString(),
      url: createdResource.url,
      status: createdResource.status,
      httpCode: createdResource.httpCode,
    };
  }

  async getResourcesList(
    query: GetResourcesRequestDto,
  ): Promise<GetResourcesResponseDto> {
    const { page = 1, limit = 20, status } = query;
    const skip: number = (page - 1) * limit;

    const filter: ResourcesFilter = {};

    if (status) {
      filter.status = status;
    }

    const resources: Resource[] = await this.resourceModel
      .find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();

    const total: number = await this.resourceModel.countDocuments(filter);

    const data: ResourcesResponseDto[] = resources.map((resource: Resource) => {
      return {
        id: resource._id.toString(),
        url: resource.url,
        status: resource.status,
        httpCode: resource.httpCode,
      };
    });

    return {
      total,
      page,
      limit,
      data,
    };
  }

  public async processJob(job: Job) {
    const { url, id } = job.data as { url: string; id: string };

    const processingResource: Resource | null =
      await this.resourceModel.findByIdAndUpdate(id, {
        status: ResourceStatus.PROCESSING,
      });

    if (!processingResource) {
      console.error(
        `Resource with ID ${id} not found. Job processing aborted.`,
      );

      return;
    }

    let status: ResourceStatus = ResourceStatus.PROCESSING;
    let httpCode: string = 'UNKNOWN';

    try {
      const response = await firstValueFrom<AxiosResponse<any>>(
        this.httpService.get(url),
      );

      status = ResourceStatus.DONE;
      httpCode = response.status.toString();
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        httpCode = 'TIME_OUT';
      } else if (error.status) {
        httpCode = String(error.status);
      }

      status = ResourceStatus.ERROR;
    } finally {
      const updatedResource = await this.updateResource(id, status, httpCode);

      if (updatedResource) {
        const resourcesResponseDto: ResourcesResponseDto = {
          id: updatedResource._id.toString(),
          url: updatedResource.url,
          status: updatedResource.status,
          httpCode: updatedResource.httpCode,
        };

        this.resourcesGateway.notifyClients(resourcesResponseDto);
      }
    }
  }

  private async updateResource(
    id: string,
    status: ResourceStatus,
    httpCode: string,
  ): Promise<Resource | null> {
    return await this.resourceModel.findByIdAndUpdate(
      id,
      {
        status,
        httpCode,
      },
      { new: true },
    );
  }
}
