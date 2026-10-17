import {z} from 'zod';
const pagination={page:z.number().int().min(0).max(1000).default(0),limit:z.number().int().min(1).max(40).default(12)};
export const catalogFilter=z.object({search:z.string().max(100).default(''),category:z.enum(['Audio','Desk','Charging','Accessories','Travel']).optional(),sort:z.enum(['featured','price-asc','price-desc']).default('featured'),...pagination}).strict();
export const shopReadSchema=z.discriminatedUnion('operation',[
 catalogFilter.extend({operation:z.literal('catalog')}),
 z.object({operation:z.literal('cart')}).strict(),
 z.object({operation:z.literal('overview')}).strict(),
 z.object({operation:z.literal('orders'),status:z.enum(['completed','pending','cancelled']).optional(),...pagination}).strict(),
 z.object({operation:z.literal('order'),orderId:z.string().min(1).max(200)}).strict(),
]);
const productId=z.string().min(1).max(200),operationId=z.string().min(1).max(300);
export const cartToolSchema=z.object({action:z.enum(['add','set']),productId,quantity:z.number().int().min(0).max(20)}).strict();
export const shopWriteSchema=z.discriminatedUnion('operation',[
 z.object({operation:z.literal('cart.add'),productId,quantity:z.number().int().min(1).max(20),operationId}).strict(),
 z.object({operation:z.literal('cart.set'),productId,quantity:z.number().int().min(0).max(20),operationId}).strict(),
 z.object({operation:z.literal('checkout'),checkoutKey:operationId,revision:z.number().int().min(0),expectedTotalCents:z.number().int().min(0)}).strict(),
]);
export type ShopRead=z.input<typeof shopReadSchema>;
export type ShopWrite=z.infer<typeof shopWriteSchema>;
export type ShopProduct={id:string;sku:string;name:string;category:string;description:string;priceCents:number;visual:string;active:boolean};
export type CartLine={product:ShopProduct;quantity:number};
export type CartResult={kind:'cart';revision:number;lines:CartLine[];quantity:number;totalCents:number;currency:'USD'};
export type ShoppingOrder={id:string;reference:string;createdAt:number;status:'completed'|'pending'|'cancelled';totalCents:number;source:'demo_seed'|'checkout';currency:'USD'};
export type OrderLine={name:string;sku:string;productId:string;quantity:number;unitPriceCents:number};
export type CatalogPage={kind:'catalog';rows:ShopProduct[];total:number;page:number;limit:number};
export type OrderPage={kind:'orders';rows:ShoppingOrder[];total:number;page:number;limit:number};
export type OrderDetail={kind:'order';order:ShoppingOrder;lines:OrderLine[]};
export type ShoppingOverview={kind:'overview';cartQuantity:number;orderCount:number;completedSpendCents:number;recentOrders:ShoppingOrder[]};
export type CheckoutResult={kind:'checkout';orderId:string;reference:string;totalCents:number;simulated:true};
export type ShoppingReadResult=CatalogPage|CartResult|OrderPage|OrderDetail|ShoppingOverview;
export type ShoppingWriteResult=CartResult|CheckoutResult;
