import { Prisma } from 'generated/prisma';

export class CreateProjectDto implements Prisma.ProjectCreateInput {
  name: string;
  port: string;
  tag: string[];
}
