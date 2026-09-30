import { ApiProperty } from '@nestjs/swagger';
import { ItemResponseDto } from './item-response.dto';

export class ListItemsResponseDto {
  @ApiProperty({
    description: 'List of items',
    type: [ItemResponseDto],
  })
  items: ItemResponseDto[];
}
