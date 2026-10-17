import { expect,it } from 'vitest';
import { businessSchema } from '../lib/data/contracts';
it('rejects forged ownership, unbounded pages, and invalid date ranges',()=>{
 for(const input of [
  {operation:'customers',ownerId:'another-user'},
  {operation:'orders',limit:500},
  {operation:'revenue',from:'2026-02-30',to:'2026-03-01'},
  {operation:'revenue',from:'2026-09-30',to:'2026-01-01'},
  {operation:'revenue',from:'2025-01-01',to:'2026-09-30'},
  {operation:'revenue',from:'2026-01-01'},
 ])expect(businessSchema.safeParse(input).success).toBe(false);
});
