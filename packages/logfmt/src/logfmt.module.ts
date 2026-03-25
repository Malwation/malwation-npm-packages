import { Global, Module } from '@nestjs/common';
import { LogfmtService } from './logfmt.service';

@Global()
@Module({
  providers: [LogfmtService],
  exports: [LogfmtService],
})
export class LogfmtModule {}
