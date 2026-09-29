import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateClientDto {
  @IsIn(['INDIVIDUAL', 'ORGANIZATION'])
  type!: 'INDIVIDUAL' | 'ORGANIZATION';

  @IsString()
  @MinLength(2)
  displayName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  phone!: string;

  @IsString()
  @MinLength(2)
  address!: string;

  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() dateOfBirth?: string;
  @IsOptional() @IsString() nationality?: string;
  @IsOptional() @IsString() idNumber?: string;
  @IsOptional() @IsString() occupation?: string;
  @IsOptional() @IsString() companyName?: string;
  @IsOptional() @IsString() vietnameseName?: string;
  @IsOptional() @IsString() englishName?: string;
  @IsOptional() @IsString() shortName?: string;
  @IsOptional() @IsString() taxCode?: string;
  @IsOptional() @IsString() enterpriseNumber?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() legalRepresentative?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsString() industry?: string;
}

export class UpdateClientDto {
  @IsOptional() @IsString() @MinLength(2) displayName?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @MinLength(8) phone?: string;
  @IsOptional() @IsString() @MinLength(2) address?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() legalRepresentative?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsString() industry?: string;
}

export class ChangeClientStatusDto {
  @IsIn(['NEW', 'IN_REVIEW', 'CONFLICT_CHECK', 'APPROVED', 'ACTIVE', 'REJECTED'])
  status!: 'NEW' | 'IN_REVIEW' | 'CONFLICT_CHECK' | 'APPROVED' | 'ACTIVE' | 'REJECTED';

  @IsOptional() @IsString() reason?: string;
}

export class CreateContactDto {
  @IsString() @MinLength(2) fullName!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(8) phone!: string;
  @IsString() @MinLength(2) position!: string;
  @IsOptional() @IsString() idNumber?: string;
  @IsOptional() isPrimary?: boolean;
  @IsOptional() @IsString() notes?: string;
}
