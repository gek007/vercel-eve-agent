import type { Customer, Product, Order, OrderItem } from '../data/contracts';
export type DemoFixtures = { customers: Customer[]; products: Product[]; orders: Order[]; items: OrderItem[] };
export function generateFixtures(): DemoFixtures {
  const first = ['Avery','Maya','Oliver','Amir','Sofia','Noah','Isla','Leo','Zoe','Ethan'];
  const last = ['Chen','Patel','Morgan','Rivera','Cohen','Kim','Bennett','Singh','Reed','Alvarez'];
  const companies = ['Northstar','Forma','Arc','Common Ground','Fieldwork','Studio Eight','Gather','Outline','Daybreak','Evergreen'];
  const regions = ['North America','Europe','Asia Pacific','Middle East','Latin America'];
  const customers = Array.from({length:250},(_,i)=>({ fixtureKey:`CUS-${String(i+1).padStart(4,'0')}`, name:`${first[i%10]} ${last[Math.floor(i/10)%10]}`, email:`customer${i+1}@example.com`, company:`${companies[i%10]} ${['Studio','Labs','Works','Collective','Group'][Math.floor(i/10)%5]} ${Math.floor(i/50)+1}`, region:regions[i%5], createdAt:Date.UTC(2025,10,1)+(i%60)*86400000 }));
  const categories = ['Workspace','Accessories','Lighting','Storage'];
  const names = ['Desk','Task chair','Monitor stand','Desk mat','Table lamp','Shelf','Laptop riser','Organizer','Side table','Cabinet'];
  const products = Array.from({length:40},(_,i)=>({ fixtureKey:`PRD-${String(i+1).padStart(3,'0')}`, name:`${['Essential','Studio','Form','Everyday'][Math.floor(i/10)]} ${names[i%10]}`, category:categories[i%4], priceCents:1900+((i*1733)%48000) }));
  const items: OrderItem[]=[];
  const orders = Array.from({length:2000},(_,i)=>{
    const fixtureKey=`ORD-${String(i+1).padStart(5,'0')}`;
    const lines = Array.from({length:3},(_,j)=>{const p=products[(i*7+j*11)%40];return {fixtureKey:`${fixtureKey}-${j+1}`,orderId:fixtureKey,productId:p.fixtureKey,quantity:1+((i+j)%3),unitPriceCents:p.priceCents};});
    items.push(...lines);
    return { fixtureKey, customerId:customers[(i*17)%250].fixtureKey, createdAt:Date.UTC(2026,0,1)+(i%273)*86400000+((i*37)%24)*3600000, status: (i%13===0?'cancelled':i%9===0?'pending':'completed') as Order['status'], totalCents:lines.reduce((s,l)=>s+l.quantity*l.unitPriceCents,0) };
  });
  return {customers,products,orders,items};
}
