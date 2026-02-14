import { IsString, IsNotEmpty, MinLength, MaxLength, Matches, IsEmail } from 'class-validator';

export class PinLoginDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  employeeId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(6)
  @Matches(/^\d+$/, { message: 'PIN must contain only numbers' })
  pin: string;
}

export class EmailLoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class OwnerLoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
