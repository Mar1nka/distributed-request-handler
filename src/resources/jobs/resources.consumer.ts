import { Injectable } from '@nestjs/common';
import { Job, Worker } from 'bullmq';

import { RESOURCES_QUEUE } from '../resources.constants';
import { ResourcesService } from '../resources.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ResourcesConsumer {
  private worker: Worker;

  constructor(
    private readonly resourceService: ResourcesService,
    private readonly configService: ConfigService,
  ) {
    const redisHost: string = this.configService.get<string>('REDIS_HOST')!;
    const redisPort: number = +this.configService.get<number>('REDIS_PORT')!;
    const concurrency: number = +this.configService.get<number>(
      'REDIS_WORKER_CONCURRENCY',
    )!;

    this.worker = new Worker(
      RESOURCES_QUEUE,
      async (job: Job) => {
        console.log('Start of job', job.id);

        await this.resourceService.processJob(job);

        console.log('Finish of job:', job.id);
      },
      {
        concurrency: concurrency,
        connection: {
          host: redisHost,
          port: redisPort,
        },
      },
    );

    this.worker.on('failed', (job, error) => {
      console.error(`Job ${job?.name} failed with error:`, error);
    });
  }
}
