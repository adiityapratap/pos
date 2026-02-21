import { Module, Global } from '@nestjs/common';
import { PosGateway } from './pos.gateway';

@Global()
@Module({
  providers: [PosGateway],
  exports: [PosGateway],
})
export class WebsocketsModule {}
