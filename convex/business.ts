import { internalQuery } from './_generated/server';
import { v } from 'convex/values';
import { businessSchema, type BusinessResult } from '../lib/data/contracts';
import { summarize, comparePeriods, inPeriod } from '../lib/demo/metrics';
export const read = internalQuery({ args:{ownerId:v.string(),input:v.any()},handler:async(ctx,{ownerId,input:raw}):Promise<BusinessResult>=>{
 const input=businessSchema.parse(raw);
 const [customers,products,orders,items,progress]=await Promise.all([
  ctx.db.query('customers').withIndex('by_owner',q=>q.eq('ownerId',ownerId)).take(251),
  ctx.db.query('products').withIndex('by_owner',q=>q.eq('ownerId',ownerId)).take(41),
  ctx.db.query('orders').withIndex('by_owner_date',q=>q.eq('ownerId',ownerId)).take(2001),
  ctx.db.query('orderItems').withIndex('by_owner',q=>q.eq('ownerId',ownerId)).take(6001),
  ctx.db.query('seedProgress').withIndex('by_owner',q=>q.eq('ownerId',ownerId)).unique(),
 ]);
 if(input.operation==='revenue')return summarize({customers,products,orders,items},input,progress?.complete??false);
 if(input.operation==='trends')return comparePeriods(orders,input);
 const customerMap=new Map(customers.map(c=>[c.fixtureKey,c]));
 if(input.operation==='customers') {
  const search=input.search.toLowerCase();const matches=customers.filter(c=>[c.name,c.company,c.email,c.region].some(s=>s.toLowerCase().includes(search)));
  return {kind:'customers',total:matches.length,page:input.page,limit:input.limit,rows:matches.slice(input.page*input.limit,(input.page+1)*input.limit).map(c=>({fixtureKey:c.fixtureKey,name:c.name,email:c.email,company:c.company,region:c.region,createdAt:c.createdAt,orderCount:orders.filter(o=>o.customerId===c.fixtureKey).length,revenueCents:orders.filter(o=>o.customerId===c.fixtureKey&&o.status==='completed').reduce((s,o)=>s+o.totalCents,0)}))};
 }
 const search=input.search.toLowerCase();const matches=orders.filter(o=>inPeriod(o,input.from,input.to)&&(!input.status||o.status===input.status)&&(!input.customerId||o.customerId===input.customerId)&&[o.fixtureKey,customerMap.get(o.customerId)?.name??'',customerMap.get(o.customerId)?.company??''].some(s=>s.toLowerCase().includes(search))).sort((a,b)=>b.createdAt-a.createdAt);
 return {kind:'orders',total:matches.length,page:input.page,limit:input.limit,rows:matches.slice(input.page*input.limit,(input.page+1)*input.limit).map(o=>({fixtureKey:o.fixtureKey,customerId:o.customerId,createdAt:o.createdAt,status:o.status,totalCents:o.totalCents,customerName:customerMap.get(o.customerId)?.name??o.customerId,company:customerMap.get(o.customerId)?.company??''}))};
}});
