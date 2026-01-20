import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';

@Injectable()
export class NewsService {
  constructor(private prisma: PrismaService) {}

  async create(createNewsDto: CreateNewsDto) {
    return this.prisma.news.create({
      data: {
        ...createNewsDto,
        isActive: createNewsDto.isActive ?? true,
        order: createNewsDto.order ?? 0,
      },
    });
  }

  async findAll(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };

    return this.prisma.news.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findActive() {
    return this.prisma.news.findMany({
      where: {
        isActive: true,
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string) {
    const news = await this.prisma.news.findUnique({
      where: { id },
    });

    if (!news) {
      throw new NotFoundException(`News with ID ${id} not found`);
    }

    return news;
  }

  async update(id: string, updateNewsDto: UpdateNewsDto) {
    const news = await this.prisma.news.findUnique({
      where: { id },
    });

    if (!news) {
      throw new NotFoundException(`News with ID ${id} not found`);
    }

    return this.prisma.news.update({
      where: { id },
      data: updateNewsDto,
    });
  }

  async remove(id: string) {
    const news = await this.prisma.news.findUnique({
      where: { id },
    });

    if (!news) {
      throw new NotFoundException(`News with ID ${id} not found`);
    }

    return this.prisma.news.delete({
      where: { id },
    });
  }

  async toggleActive(id: string) {
    const news = await this.prisma.news.findUnique({
      where: { id },
    });

    if (!news) {
      throw new NotFoundException(`News with ID ${id} not found`);
    }

    return this.prisma.news.update({
      where: { id },
      data: { isActive: !news.isActive },
    });
  }
}
