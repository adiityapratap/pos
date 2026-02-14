import { Module } from '@nestjs/common';
import { CombosController } from './combos.controller';
import { CombosService } from './combos.service';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CombosController],
  providers: [CombosService],
  exports: [CombosService],
})
export class CombosModule {}
