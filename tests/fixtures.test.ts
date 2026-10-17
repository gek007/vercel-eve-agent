import { expect, it } from 'vitest';
import { generateFixtures } from '../lib/demo/fixtures';
import { summarize, comparePeriods } from '../lib/demo/metrics';
it('generates deterministic records with valid relationships and cent totals', () => {
  const f = generateFixtures(); expect(f).toEqual(generateFixtures());
  expect([f.customers.length,f.products.length,f.orders.length,f.items.length]).toEqual([250,40,2000,6000]);
  const customers = new Set(f.customers.map(c=>c.fixtureKey)); const products = new Set(f.products.map(p=>p.fixtureKey));
  for (const o of f.orders) {
    expect(customers.has(o.customerId)).toBe(true);
    const items = f.items.filter(i=>i.orderId===o.fixtureKey); expect(items).toHaveLength(3);
    expect(o.totalCents).toBe(items.reduce((sum,i)=>sum+i.quantity*i.unitPriceCents,0));
    for (const i of items) expect(products.has(i.productId)).toBe(true);
  }
});
const customers = [{fixtureKey:'c1',name:'Ada',email:'a@example.com',company:'One',region:'Europe',createdAt:0}];
const orders = [
  {fixtureKey:'o1',customerId:'c1',createdAt:Date.parse('2026-01-01T00:00:00Z'),status:'completed' as const,totalCents:1500},
  {fixtureKey:'o2',customerId:'c1',createdAt:Date.parse('2026-01-31T23:59:59Z'),status:'completed' as const,totalCents:2500},
  {fixtureKey:'o3',customerId:'c1',createdAt:Date.parse('2026-02-01T00:00:00Z'),status:'completed' as const,totalCents:9000},
  {fixtureKey:'o4',customerId:'c1',createdAt:Date.parse('2026-01-10'),status:'cancelled' as const,totalCents:6000},
  {fixtureKey:'o5',customerId:'c1',createdAt:Date.parse('2026-01-11'),status:'pending' as const,totalCents:7000},
];
it('uses inclusive UTC dates and completed orders only',()=>{
 const r = summarize({customers,products:[],orders,items:[]},{operation:'revenue',from:'2026-01-01',to:'2026-01-31',groupBy:'month'},true);
 expect(r.revenueCents).toBe(4000);expect(r.completedOrders).toBe(2);expect(r.totalOrders).toBe(4);expect(r.groups[0].revenueCents).toBe(4000);
});
it('defines empty and zero prior-period comparisons',()=>{
 expect(summarize({customers:[],products:[],orders:[],items:[]},{operation:'revenue',groupBy:'month'},false).revenueCents).toBe(0);
 const r=comparePeriods(orders,{operation:'trends',from:'2026-01-01',to:'2026-01-31'});
 expect(r.currentCents).toBe(4000); expect(r.previousCents).toBe(0);expect(r.changePercent).toBeNull();expect(r.previousTo).toBe('2025-12-31');
});
