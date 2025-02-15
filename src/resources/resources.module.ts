import { Module } from '@nestjs/common';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';
import { ResourceSchema } from './schemas/resource.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { ResourcesConsumer } from './jobs/resources.consumer';
import { BullModule } from '@nestjs/bullmq';
import {
  RESOURCES_DB_COLLECTION_NAME,
  RESOURCES_QUEUE,
} from './resources.constants';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RESOURCES_DB_COLLECTION_NAME, schema: ResourceSchema },
    ]),
    BullModule.registerQueue({
      name: RESOURCES_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: 5000,
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        timeout: +configService.get('HTTP_TIMEOUT_IN_MS'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ResourcesController],
  providers: [ResourcesService, ResourcesConsumer],
})
export class ResourcesModule {}
