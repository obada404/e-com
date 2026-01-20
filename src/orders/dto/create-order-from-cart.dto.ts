import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderFromCartDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Cart ID to create order from',
  })
  @IsUUID()
  @IsNotEmpty()
  cartId: string;
}
