/// <reference types="vite/client" />
import {convexTest} from 'convex-test';
import {expect,it} from 'vitest';
import schema from '../convex/schema';
import {internal} from '../convex/_generated/api';
const modules=import.meta.glob('../convex/**/*.ts');
it('seeds 40 products and 24 personal orders idempotently without touching analytics',async()=>{
 const t=convexTest(schema,modules);
 await t.run(ctx=>ctx.db.insert('customers',{ownerId:'alice',fixtureKey:'old',name:'Old',email:'a@b.c',company:'Old',region:'US',createdAt:0}));
 await t.mutation(internal.shopSeed.seed,{ownerId:'alice'});
 await t.mutation(internal.shopSeed.seed,{ownerId:'alice'});
 const catalog=await t.query(internal.shopping.read,{ownerId:'bob',input:{operation:'catalog',limit:40}});
 expect(catalog.kind).toBe('catalog'); if(catalog.kind==='catalog')expect(catalog.total).toBe(40);
 const a=await t.query(internal.shopping.read,{ownerId:'alice',input:{operation:'orders',limit:40}});
 expect(a.kind).toBe('orders');if(a.kind==='orders'){
 expect(a.total).toBe(24);
 const detail=await t.query(internal.shopping.read,{ownerId:'alice',input:{operation:'order',orderId:a.rows[0].id}});
 if(detail.kind==='order')expect(detail.order.totalCents).toBe(detail.lines.reduce((s,l)=>s+l.quantity*l.unitPriceCents,0));
 await expect(t.query(internal.shopping.read,{ownerId:'bob',input:{operation:'order',orderId:a.rows[0].id}})).rejects.toThrow('not available');
 }
 expect(await t.run(async ctx=>(await ctx.db.query('customers').collect()).length)).toBe(1);
 const bob=await t.query(internal.shopping.read,{ownerId:'bob',input:{operation:'orders'}});expect(bob).toMatchObject({total:0});
});
it('validates filters and paginates without repeating order IDs',async()=>{
 const t=convexTest(schema,modules);await t.mutation(internal.shopSeed.seed,{ownerId:'alice'});
 const a=await t.query(internal.shopping.read,{ownerId:'alice',input:{operation:'orders',limit:5,page:0}});
 const b=await t.query(internal.shopping.read,{ownerId:'alice',input:{operation:'orders',limit:5,page:1}});
 if(a.kind==='orders'&&b.kind==='orders')expect(a.rows.some(x=>b.rows.some(y=>x.id===y.id))).toBe(false);
 await expect(t.query(internal.shopping.read,{ownerId:'alice',input:{operation:'catalog',limit:999}})).rejects.toThrow();
});
