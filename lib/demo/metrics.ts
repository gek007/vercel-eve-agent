import type { BusinessRequest, Order, RevenueResult, TrendResult } from '../data/contracts';
import type { DemoFixtures } from './fixtures';
export const day = 86400000;
export function period(from?: string, to?: string) { return { start:from?Date.parse(from):Date.UTC(2026,0,1), end:to?Date.parse(to)+day:Date.UTC(2026,9,1) }; }
export function inPeriod(o: Order, from?:string,to?:string) { const p=period(from,to);return o.createdAt>=p.start&&o.createdAt<p.end; }
export function summarize(data: DemoFixtures, input: Extract<BusinessRequest,{operation:'revenue'}>, seeded:boolean): RevenueResult {
 const {customers,products,orders,items}=data; const range=period(input.from,input.to);
 const filtered=orders.filter(o=>inPeriod(o,input.from,input.to)); const completed=filtered.filter(o=>o.status==='completed');
 const customerMap=new Map(customers.map(c=>[c.fixtureKey,c])); const productMap=new Map(products.map(p=>[p.fixtureKey,p]));
 const groups=new Map<string,{revenueCents:number;orders:Set<string>}>();
 const add=(label:string,cents:number,id:string)=>{const g=groups.get(label)??{revenueCents:0,orders:new Set<string>()};g.revenueCents+=cents;g.orders.add(id);groups.set(label,g);};
 const completedIds=new Set(completed.map(o=>o.fixtureKey));
 if(input.groupBy==='product') {
  for(const item of items) if(completedIds.has(item.orderId)) add(productMap.get(item.productId)?.name??item.productId,item.quantity*item.unitPriceCents,item.orderId);
 } else for(const order of completed) {
  const customer=customerMap.get(order.customerId);
  const label=input.groupBy==='customer'?`${customer?.name??order.customerId} (${order.customerId})`:input.groupBy==='region'?(customer?.region??'Unknown'):new Date(order.createdAt).toISOString().slice(0,7);
  add(label,order.totalCents,order.fixtureKey);
 }
 const revenueCents=completed.reduce((sum,o)=>sum+o.totalCents,0);
 const recentOrders=[...filtered].sort((a,b)=>b.createdAt-a.createdAt).slice(0,6).map(o=>({...o,customerName:customerMap.get(o.customerId)?.name??o.customerId,company:customerMap.get(o.customerId)?.company??''}));
 return {kind:'revenue',currency:'USD',definition:'Completed orders only. Pending and cancelled orders excluded. Dates use UTC.',from:new Date(range.start).toISOString().slice(0,10),to:new Date(range.end-day).toISOString().slice(0,10),revenueCents,completedOrders:completed.length,totalOrders:filtered.length,customers:customers.length,averageOrderCents:completed.length?Math.round(revenueCents/completed.length):0,groups:Array.from(groups,([label,g])=>({label,revenueCents:g.revenueCents,orders:g.orders.size})).sort(input.groupBy==='month'?(a,b)=>a.label.localeCompare(b.label):(a,b)=>b.revenueCents-a.revenueCents),recentOrders,seeded};
}
export function comparePeriods(orders:Order[],input:Extract<BusinessRequest,{operation:'trends'}>):TrendResult {
 const {start,end}=period(input.from,input.to);const length=end-start;const previousStart=start-length;
 const sum=(a:number,b:number)=>orders.filter(o=>o.status==='completed'&&o.createdAt>=a&&o.createdAt<b).reduce((s,o)=>s+o.totalCents,0);
 const currentCents=sum(start,end),previousCents=sum(previousStart,start),changeCents=currentCents-previousCents;
 return {kind:'trends',from:input.from,to:input.to,previousFrom:new Date(previousStart).toISOString().slice(0,10),previousTo:new Date(start-day).toISOString().slice(0,10),currentCents,previousCents,changeCents,changePercent:previousCents===0?null:changeCents/previousCents*100};
}
