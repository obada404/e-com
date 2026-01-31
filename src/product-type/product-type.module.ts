import { Global, Module } from '@nestjs/common';
import { ProductTypeService } from './product-type.service';
import { PrismaService } from '../prisma/prisma.service';

@Global()
@Module({
  providers: [ProductTypeService, PrismaService],
  exports: [ProductTypeService],
})
export class ProductTypeModule {}
