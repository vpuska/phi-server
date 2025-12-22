import { Module } from '@nestjs/common';
import { SystemService } from './system.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { System } from './entities/system.entity';

@Module({
  imports: [TypeOrmModule.forFeature([System])],
  providers: [SystemService],
  exports: [TypeOrmModule, SystemService],
})
export class SystemModule {


}
