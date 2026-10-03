import { ApiProperty } from '@nestjs/swagger';
import { ProductResponseDto } from './product-response.dto';

export class ListProductsResponseDto {
  @ApiProperty({
    description: 'Lista de produtos',
    type: [ProductResponseDto],
  })
  products: ProductResponseDto[];
}
