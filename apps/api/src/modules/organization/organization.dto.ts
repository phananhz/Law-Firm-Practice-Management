import { IsArray, IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  @MinLength(2)
  code!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  managerName?: string;
}

export class UpdateDepartmentDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  code?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  managerName?: string;
}

export class CreateEmployeeDto {
  @IsString()
  @MinLength(2)
  employeeCode!: string;

  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  phone!: string;

  @IsString()
  departmentId!: string;

  @IsString()
  positionId!: string;

  @IsOptional()
  @IsString()
  managerId?: string;

  @IsArray()
  @IsString({ each: true })
  roles!: string[];

  @IsString()
  startDate!: string;
}

export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  phone?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  positionId?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'SUSPENDED', 'RESIGNED'])
  status?: 'ACTIVE' | 'SUSPENDED' | 'RESIGNED';
}

export class UpdateRolePermissionsDto {
  @IsArray()
  @IsString({ each: true })
  permissions!: string[];
}
