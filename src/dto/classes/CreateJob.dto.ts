import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNotEmptyObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

/**
 * Body of POST /api/v1/recruiter/jobs.
 * Mirrors jobFormSchema in the recruiter panel (src/containers/JobForm/schema.ts).
 */

const WEIGHTED_TYPES = ['mandatory', 'preferred'];
const SKILL_TYPES = ['mandatory', 'preferred', 'not_required'];

export class SkillDTO {
  @IsString({ message: 'Skill name must be a string.' })
  @IsNotEmpty({ message: 'Enter a skill name.' })
  @MaxLength(200, { message: 'Skill name must be at most 200 characters.' })
  name!: string;

  @IsIn(SKILL_TYPES, { message: 'Skill type must be mandatory, preferred or not_required.' })
  type!: 'mandatory' | 'preferred' | 'not_required';
}

export class EducationDTO {
  @IsOptional()
  @IsString({ message: 'Education must be a string.' })
  @MaxLength(200, { message: 'Education must be at most 200 characters.' })
  name?: string;

  @IsIn(WEIGHTED_TYPES, { message: 'Education type must be mandatory or preferred.' })
  type!: 'mandatory' | 'preferred';
}

export class OtherRequirementDTO {
  @IsString({ message: 'Requirement must be a string.' })
  @IsNotEmpty({ message: 'Describe the requirement.' })
  @MaxLength(200, { message: 'Requirement must be at most 200 characters.' })
  name!: string;

  @IsIn(WEIGHTED_TYPES, { message: 'Requirement type must be mandatory or preferred.' })
  type!: 'mandatory' | 'preferred';
}

export default class CreateJobDTO {
  @IsString({ message: 'Job position must be a string.' })
  @IsNotEmpty({ message: 'Job position is required.' })
  @MinLength(3, { message: 'Enter the job position (at least 3 characters).' })
  @MaxLength(150, { message: 'Job position must be at most 150 characters.' })
  title!: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string.' })
  @MaxLength(500, { message: 'Keep the description under 500 characters.' })
  description?: string;

  @IsInt({ message: 'Minimum experience must be a whole number of years.' })
  @Min(0, { message: "Experience can't be negative." })
  @Max(40, { message: 'Enter a realistic number of years.' })
  minExperience!: number;

  @IsIn(WEIGHTED_TYPES, { message: 'Experience type must be mandatory or preferred.' })
  experienceType!: 'mandatory' | 'preferred';

  @IsArray({ message: 'Skills must be a list.' })
  @ArrayMinSize(1, { message: 'Add at least one technical skill.' })
  @ArrayMaxSize(50, { message: 'Add at most 50 skills.' })
  @ValidateNested({ each: true })
  @Type(() => SkillDTO)
  skills!: SkillDTO[];

  @IsOptional()
  @IsNotEmptyObject({}, { message: 'Education must be an object with name and type.' })
  @ValidateNested()
  @Type(() => EducationDTO)
  education?: EducationDTO;

  @IsOptional()
  @IsArray({ message: 'Other requirements must be a list.' })
  @ArrayMaxSize(30, { message: 'Add at most 30 other requirements.' })
  @ValidateNested({ each: true })
  @Type(() => OtherRequirementDTO)
  otherRequirements?: OtherRequirementDTO[];
}
