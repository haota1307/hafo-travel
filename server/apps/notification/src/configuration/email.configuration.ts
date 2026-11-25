import { IsString } from 'class-validator';

export class EmailConfiguration {
  @IsString()
  API_KEY = process.env['RESEND_API_KEY']?.trim() || '';

  @IsString()
  FROM = process.env['RESEND_FROM_EMAIL']?.trim() || '';
}
