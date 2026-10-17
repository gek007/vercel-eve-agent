import {internalQuery} from './_generated/server';
import type {QueryCtx} from './_generated/server';
import type {Doc} from './_generated/dataModel';
import {v,ConvexError} from 'convex/values';
import {shopReadSchema,type ShopProduct,type ShoppingOrder,type CartResult,type ShoppingReadResult} from '../lib/shop/contracts';
export function shopError(code:string,message:string):never{throw new ConvexError({code,message});}
export function productView(p:Doc<'shopProducts'>):ShopProduct{return {id:p._id,sku:p.sku,name:p.name,category:p.category,description:p.description,priceCents:p.priceCents,visual:p.visual,active:p.active};}
export function orderView(o:Doc<'shoppingOrders'>):ShoppingOrder{return {id:o._id,reference:o.reference,createdAt:o.createdAt,status:o.status,currency:o.currency,totalCents:o.totalCents,source:o.source};}
export async function cartView(ctx:Pick<QueryCtx,'db'>,ownerId:string):Promise<CartResult>{
 const cart=await ctx.db.query('shoppingCarts').withIndex('by_owner',q=>q.eq('ownerId',ownerId)).unique();
 const items=await ctx.db.query('shoppingCartItems').withIndex('by_owner',q=>q.eq('ownerId',ownerId)).take(41);
 const lines=[];for(const item of items){const p=await ctx.db.get(item.productId);if(!p)shopError('CART_CHANGED','A product is no longer available. Remove it and review your cart.');lines.push({product:productView(p),quantity:item.quantity});}
 return {kind:'cart',revision:cart?.revision??0,lines,quantity:lines.reduce((s,l)=>s+l.quantity,0),totalCents:lines.reduce((s,l)=>s+l.product.priceCents*l.quantity,0),currency:'USD'};
}
export const read=internalQuery({args:{ownerId:v.string(),input:v.any()},handler:async(ctx,{ownerId,input:raw}):Promise<ShoppingReadResult>=>{
 const input=shopReadSchema.parse(raw);
 if(input.operation==='catalog'){
  let products=(await ctx.db.query('shopProducts').take(200)).filter(p=>p.active&&(!input.category||p.category===input.category)&&`${p.name} ${p.description} ${p.sku}`.toLowerCase().includes(input.search.toLowerCase()));
  if(input.sort!=='featured')products=products.sort((a,b)=>(a.priceCents-b.priceCents)*(input.sort==='price-asc'?1:-1));
  return {kind:'catalog',rows:products.slice(input.page*input.limit,(input.page+1)*input.limit).map(productView),total:products.length,page:input.page,limit:input.limit};
 }
 if(input.operation==='cart')return cartView(ctx,ownerId);
 if(input.operation==='order'){
  const id=ctx.db.normalizeId('shoppingOrders',input.orderId);const o=id?await ctx.db.get(id):null;
  if(!o||o.ownerId!==ownerId)shopError('NOT_FOUND','This order is not available to your account.');
  const items=await ctx.db.query('shoppingOrderItems').withIndex('by_owner_order',q=>q.eq('ownerId',ownerId).eq('orderId',o._id)).take(41);
  return {kind:'order',order:orderView(o),lines:items.map(l=>({name:l.name,sku:l.sku,productId:l.productId,quantity:l.quantity,unitPriceCents:l.unitPriceCents}))};
 }
 const orders=await ctx.db.query('shoppingOrders').withIndex('by_owner_date',q=>q.eq('ownerId',ownerId)).order('desc').take(1000);
 if(input.operation==='overview'){const cart=await cartView(ctx,ownerId);return {kind:'overview',cartQuantity:cart.quantity,orderCount:orders.length,completedSpendCents:orders.filter(o=>o.status==='completed').reduce((s,o)=>s+o.totalCents,0),recentOrders:orders.slice(0,5).map(orderView)};}
 const matches=orders.filter(o=>!input.status||o.status===input.status);
 return {kind:'orders',rows:matches.slice(input.page*input.limit,(input.page+1)*input.limit).map(orderView),total:matches.length,page:input.page,limit:input.limit};
}});
