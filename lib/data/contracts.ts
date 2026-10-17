import { z } from 'zod';
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s => Number.isFinite(Date.parse(s)) && new Date(s).toISOString().slice(0,10) === s, 'Use a valid YYYY-MM-DD date.');
const dates = { from: date.optional(), to: date.optional() };
export const customerFilter = z.object({ search: z.string().max(100).default(''), page: z.number().int().min(0).max(1000).default(0), limit: z.number().int().min(1).max(50).default(20) }).strict();
export const orderFilter = z.object({ ...dates, search: z.string().max(100).default(''), customerId: z.string().max(100).optional(), status: z.enum(['completed','pending','cancelled']).optional(), page: z.number().int().min(0).max(1000).default(0), limit: z.number().int().min(1).max(50).default(20) }).strict();
export const revenueFilter = z.object({ ...dates, groupBy: z.enum(['month','product','customer','region']).default('month') }).strict();
export const trendFilter = z.object({ from: date, to: date }).strict();
export const businessSchema = z.discriminatedUnion('operation', [
  customerFilter.extend({ operation: z.literal('customers') }),
  orderFilter.extend({ operation: z.literal('orders') }),
  revenueFilter.extend({ operation: z.literal('revenue') }),
  trendFilter.extend({ operation: z.literal('trends') }),
]).superRefine((input, ctx) => {
  if ('from' in input && 'to' in input) {
    if (!!input.from !== !!input.to) ctx.addIssue({ code: 'custom', message: 'Provide both from and to dates.' });
    if (input.from && input.to) {
      const days = (Date.parse(input.to) - Date.parse(input.from)) / 86400000;
      if (days < 0 || days >= 366) ctx.addIssue({ code: 'custom', message: 'Date range must be ordered and at most 366 days.' });
    }
  }
});
export type BusinessRequest = z.infer<typeof businessSchema>;
export type Customer = { fixtureKey: string; name: string; email: string; company: string; region: string; createdAt: number };
export type Product = { fixtureKey: string; name: string; category: string; priceCents: number };
export type Order = { fixtureKey: string; customerId: string; createdAt: number; status: 'completed'|'pending'|'cancelled'; totalCents: number };
export type OrderItem = { fixtureKey: string; orderId: string; productId: string; quantity: number; unitPriceCents: number };
export type CustomerPage = { kind: 'customers'; rows: (Customer & { orderCount: number; revenueCents: number })[]; total: number; page: number; limit: number };
export type OrderPage = { kind: 'orders'; rows: (Order & { customerName: string; company: string })[]; total: number; page: number; limit: number };
export type RevenueResult = { kind: 'revenue'; currency: 'USD'; definition: string; from: string; to: string; revenueCents: number; completedOrders: number; totalOrders: number; customers: number; averageOrderCents: number; groups: { label: string; revenueCents: number; orders: number }[]; recentOrders: (Order & { customerName: string; company: string })[]; seeded: boolean };
export type TrendResult = { kind: 'trends'; from: string; to: string; previousFrom: string; previousTo: string; currentCents: number; previousCents: number; changeCents: number; changePercent: number|null };
export type BusinessResult = CustomerPage | OrderPage | RevenueResult | TrendResult;
export type Conversation = { sessionId: string; title: string; createdAt: number };
