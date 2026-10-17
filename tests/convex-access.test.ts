/// <reference types="vite/client" />
import { convexTest } from 'convex-test';
import { expect, it } from 'vitest';
import schema from '../convex/schema';
import { internal } from '../convex/_generated/api';
const modules = import.meta.glob('../convex/**/*.ts');
it('enforces conversation ownership and idempotent claims', async()=>{
 const t=convexTest(schema,modules);
 await t.mutation(internal.conversations.claim,{ownerId:'alice',sessionId:'s1',title:'One'});
 await t.mutation(internal.conversations.claim,{ownerId:'alice',sessionId:'s1',title:'Again'});
 await expect(t.mutation(internal.conversations.claim,{ownerId:'bob',sessionId:'s1',title:'Theft'})).rejects.toThrow('Forbidden');
 expect(await t.query(internal.conversations.assertOwner,{ownerId:'bob',sessionId:'s1'})).toBe(false);
 expect(await t.query(internal.conversations.assertOwner,{ownerId:'alice',sessionId:'missing'})).toBe(false);
 expect(await t.query(internal.conversations.list,{ownerId:'alice'})).toHaveLength(1);
 expect(await t.query(internal.conversations.list,{ownerId:'bob'})).toEqual([]);
});
it('scopes direct business results and foreign identifiers', async()=>{
 const t=convexTest(schema,modules);
 await t.run(async ctx=>{await ctx.db.insert('customers',{ownerId:'alice',fixtureKey:'c1',name:'Alice',email:'a@example.com',company:'Private',region:'EU',createdAt:0});});
 const input={operation:'customers',search:'',page:0,limit:20};
 expect(await t.query(internal.business.read,{ownerId:'bob',input})).toMatchObject({rows:[],total:0});
 expect(await t.query(internal.business.read,{ownerId:'alice',input})).toMatchObject({total:1});
});
it('denies unsigned HTTP access',async()=>{
 const t=convexTest(schema,modules);
 const result=await t.fetch('/private/data',{method:'POST',body:'{}'});
 expect(result.status).toBe(401);
});
