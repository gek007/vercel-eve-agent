/// <reference types="vite/client" />
import {convexTest} from 'convex-test';import {expect,it} from 'vitest';import schema from '../convex/schema';import {internal} from '../convex/_generated/api';
const modules=import.meta.glob('../convex/**/*.ts');
it('persists private cart quantities and deduplicates retried adds',async()=>{
 const t=convexTest(schema,modules);await t.mutation(internal.shopSeed.seed,{ownerId:'alice'});
 const p=await t.run(async ctx=>(await ctx.db.query('shopProducts').first())!);
 const write=(ownerId:string,input:unknown)=>t.mutation(internal.shopping.write,{ownerId,input});
 const add={operation:'cart.add',productId:p._id,quantity:2,operationId:'one'};
 expect(await write('alice',add)).toMatchObject({quantity:2,totalCents:p.priceCents*2});
 expect(await write('alice',add)).toMatchObject({quantity:2});
 await expect(write('alice',{...add,quantity:3})).rejects.toThrow('reused');
 expect(await t.query(internal.shopping.read,{ownerId:'bob',input:{operation:'cart'}})).toMatchObject({quantity:0});
 expect(await write('alice',{...add,operation:'cart.set',quantity:4,operationId:'two'})).toMatchObject({quantity:4});
 expect(await write('alice',{...add,operation:'cart.set',quantity:0,operationId:'three'})).toMatchObject({quantity:0});
 await expect(write('alice',{...add,quantity:21,operationId:'four'})).rejects.toThrow();
 await t.run(ctx=>ctx.db.patch(p._id,{active:false}));
 await expect(write('alice',{...add,operationId:'five'})).rejects.toThrow('available');
 await expect(write('alice',{...add,productId:'missing',operationId:'six'})).rejects.toThrow('available');
});
