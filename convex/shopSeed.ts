import {internalMutation,internalQuery} from './_generated/server';
import {v} from 'convex/values';
import {shopCatalog} from '../lib/shop/catalog';
export const seed=internalMutation({args:{ownerId:v.string()},handler:async(ctx,{ownerId})=>{
 const products=[];
 for(const product of shopCatalog){
  const existing=await ctx.db.query('shopProducts').withIndex('by_sku',q=>q.eq('sku',product.sku)).unique();
  products.push(existing?existing._id:await ctx.db.insert('shopProducts',product));
 }
 const previous=await ctx.db.query('shoppingSeedProgress').withIndex('by_owner',q=>q.eq('ownerId',ownerId)).unique();
 if(previous?.complete)return {products:40,orders:24,alreadySeeded:true};
 for(let i=0;i<24;i++){
  const chosen=[i%40,(i*3+7)%40];const total=chosen.reduce((s,j)=>s+shopCatalog[j].priceCents*(1+(i%2)),0);
  const id=await ctx.db.insert('shoppingOrders',{ownerId,reference:`CC-DEMO-${String(i+1).padStart(4,'0')}`,createdAt:Date.UTC(2026,8,30-i*4,12),status:i%9===0?'cancelled':i%7===0?'pending':'completed',currency:'USD',totalCents:total,source:'demo_seed',checkoutKey:`seed:1:${i}`,cartRevision:-i-1});
  for(const j of chosen)await ctx.db.insert('shoppingOrderItems',{ownerId,orderId:id,productId:products[j],sku:shopCatalog[j].sku,name:shopCatalog[j].name,quantity:1+i%2,unitPriceCents:shopCatalog[j].priceCents});
 }
 if(previous)await ctx.db.patch(previous._id,{complete:true,version:1});else await ctx.db.insert('shoppingSeedProgress',{ownerId,version:1,complete:true});
 return {products:40,orders:24,alreadySeeded:false};
}});
export const counts=internalQuery({args:{ownerId:v.string()},handler:async(ctx,{ownerId})=>({products:(await ctx.db.query('shopProducts').collect()).length,orders:(await ctx.db.query('shoppingOrders').withIndex('by_owner_date',q=>q.eq('ownerId',ownerId)).collect()).length})});
