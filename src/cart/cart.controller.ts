import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

@ApiTags('cart')
@Controller('cart')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get user cart' })
  async getCart(@GetUser() user: { id: string }) {
    return this.cartService.getOrCreateCart(user.id);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add item to cart' })
  async addToCart(
    @GetUser() user: { id: string },
    @Body() addToCartDto: AddToCartDto,
  ) {
    return this.cartService.addToCart(user.id, addToCartDto);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update cart item quantity' })
  async updateCartItem(
    @GetUser() user: { id: string },
    @Param('id', ParseUUIDPipe) itemId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    return this.cartService.updateCartItem(user.id, itemId, updateCartItemDto);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Remove item from cart' })
  async removeFromCart(
    @GetUser() user: { id: string },
    @Param('id', ParseUUIDPipe) itemId: string,
  ) {
    return this.cartService.removeFromCart(user.id, itemId);
  }

  @Delete('clear')
  @ApiOperation({ summary: 'Clear all cart items' })
  async clearCart(@GetUser() user: { id: string }) {
    return this.cartService.clearCart(user.id);
  }
}


