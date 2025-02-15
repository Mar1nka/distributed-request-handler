import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Resource } from './schemas/resource.schema';
import { CreateResourceRequestDto } from './dto/create-resource-request.dto';
import { ResourceStatus } from './resources.enum';
import { GetResourcesRequestDto } from './dto/get-resources-request.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import {
  RESOURCES_DB_COLLECTION_NAME,
  RESOURCES_QUEUE,
} from './resources.constants';
import { CreateResourceResponseDto } from './dto/create-resource-response.dto';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { HttpService } from '@nestjs/axios';
import { GetResourcesResponseDto } from './dto/get-resources-response.dto';

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

  async getResourceRequestsList(
    query: GetResourcesRequestDto,
  ): Promise<GetResourcesResponseDto> {
    const { page = 1, limit = 20, status } = query;
    const skip: number = (page - 1) * limit;

    const filter: ResourcesFilter = {};

    if (status) {
      filter.status = status;
    }

    const data = await this.resourceModel
      .find(filter)
      .skip(skip)
      .limit(limit)
      .exec();

    const total: number = await this.resourceModel.countDocuments(query);

    return {
      total,
      page,
      limit,
      data,
    };
  }

  public async processJob(job: Job) {
    const { url, id } = job.data as { url: string; id: string };

    const first = await this.resourceModel.findByIdAndUpdate(id, {
      status: ResourceStatus.PROCESSING,
    });

    console.log('first', first);

    try {
      const response = await firstValueFrom<AxiosResponse<any>>(
        this.httpService.get(url),
      );

      await this.updateResource(
        id,
        ResourceStatus.DONE,
        response.status.toString(),
      );
    } catch (error: any) {
      let httpCode: string = 'UNKNOWN';

      if (error.code === 'ECONNABORTED') {
        httpCode = error.code as string;
      } else if (error.status) {
        httpCode = String(error.status);
      }

      const err = await this.updateResource(id, ResourceStatus.ERROR, httpCode);
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
