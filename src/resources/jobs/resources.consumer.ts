import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';

import { RESOURCES_QUEUE } from '../resources.constants';
import { ResourcesService } from '../resources.service';

@Processor(RESOURCES_QUEUE)
@Injectable()
export class ResourcesConsumer extends WorkerHost {
  constructor(private readonly resourceService: ResourcesService) {
    super();
  }

  async process(job: Job) {
    console.log('Start of job', job.id);

    await this.resourceService.processJob(job);

    console.log('Finish of job:', job.id);
  }
}
