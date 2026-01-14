import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) {}

  async create(createPromotionDto: CreatePromotionDto) {
    const appearanceDate = new Date(createPromotionDto.appearanceDate);
    const closeDate = new Date(createPromotionDto.closeDate);

    if (closeDate <= appearanceDate) {
      throw new BadRequestException(
        'Close date must be after appearance date',
      );
    }

    return this.prisma.promotion.create({
      data: {
        ...createPromotionDto,
        appearanceDate,
        closeDate,
      },
    });
  }

  async findAll(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };

    return this.prisma.promotion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActive() {
    const now = new Date();

    return this.prisma.promotion.findMany({
      where: {
        isActive: true,
        appearanceDate: { lte: now },
        closeDate: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id },
    });

    if (!promotion) {
      throw new NotFoundException(`Promotion with ID ${id} not found`);
    }

    return promotion;
  }

  async update(id: string, updatePromotionDto: UpdatePromotionDto) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id },
    });

    if (!promotion) {
      throw new NotFoundException(`Promotion with ID ${id} not found`);
    }

    const updateData: any = { ...updatePromotionDto };

    if (updatePromotionDto.appearanceDate) {
      updateData.appearanceDate = new Date(updatePromotionDto.appearanceDate);
    }

    if (updatePromotionDto.closeDate) {
      updateData.closeDate = new Date(updatePromotionDto.closeDate);
    }

    if (
      updateData.appearanceDate &&
      updateData.closeDate &&
      updateData.closeDate <= updateData.appearanceDate
    ) {
      throw new BadRequestException(
        'Close date must be after appearance date',
      );
    }

    return this.prisma.promotion.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id },
    });

    if (!promotion) {
      throw new NotFoundException(`Promotion with ID ${id} not found`);
    }

    return this.prisma.promotion.delete({
      where: { id },
    });
  }

  async toggleActive(id: string) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id },
    });

    if (!promotion) {
      throw new NotFoundException(`Promotion with ID ${id} not found`);
    }

    return this.prisma.promotion.update({
      where: { id },
      data: { isActive: !promotion.isActive },
    });
  }
}


