import {
  Body,
  ConflictException,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PrismaClientKnownRequestError } from 'generated/prisma/runtime/library';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  async create(@Body() payload: CreateProjectDto) {
    try {
      return await this.projectService.create(payload);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002')
          throw new ConflictException(
            'Name or port already exist. Please change either one of them!',
          );
      } else throw error;
    }
  }

  @Get()
  findAll() {
    return this.projectService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.projectService.findById(id);
  }

  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'logo', maxCount: 1 },
      { name: 'icon', maxCount: 1 },
    ]),
  )
  update(
    @Param('id') id: string,
    @Body() payload: UpdateProjectDto,
    @UploadedFiles()
    files?: {
      logo?: Express.Multer.File[];
      icon?: Express.Multer.File[];
    },
  ) {
    return this.projectService.update(id, {
      ...payload,
      icon: files?.icon?.[0],
      logo: files?.logo?.[0],
    });
  }

  @Post(':id/generate') generateManually(@Param('id') id: string) {
    return this.projectService.generateManually(id);
  }

  @Post(':id/stop') stopDeployment(@Param('id') id: string) {
    return this.projectService.stopDeployment(id);
  }
}
