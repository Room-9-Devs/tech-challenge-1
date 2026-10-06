import { OmitType } from '@nestjs/swagger';
import { CreateVehicleRequestDto } from './create-vehicle-request.dto';

// Ownership is immutable; only the vehicle details can be replaced.
export class UpdateVehicleRequestDto extends OmitType(CreateVehicleRequestDto, ['user_id'] as const) {}
