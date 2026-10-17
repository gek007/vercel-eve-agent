import { requireProPage } from "@/lib/auth/page";
import { queryBusiness } from "@/lib/data/client";
import { businessSchema } from "@/lib/data/contracts";
import { OrdersTable, Pagination } from "@/components/business-tables";
import { AccessState } from "@/components/access-state";
export default async function Orders({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const caller = await requireProPage();
  const raw = await searchParams;
  const get = (key: string) =>
    typeof raw[key] === "string" ? (raw[key] as string) : "";
  const params = {
    search: get("search"),
    status: get("status"),
    from: get("from"),
    to: get("to"),
    customerId: get("customerId"),
  };
  const page = raw.page === undefined ? 0 : Number(raw.page);
  const parsed = businessSchema.safeParse({
    operation: "orders",
    ...params,
    status: params.status || undefined,
    from: params.from || undefined,
    to: params.to || undefined,
    customerId: params.customerId || undefined,
    page,
    limit: 20,
  });
  if (!parsed.success)
    return (
      <AccessState
        title="Check your filters"
        message={parsed.error.issues.map((i) => i.message).join(" ")}
      />
    );
  let result;
  try {
    result = await queryBusiness(caller, parsed.data);
  } catch {
    return (
      <AccessState message="We couldn’t retrieve orders. Please try again." />
    );
  }
  if (result.kind !== "orders") return null;
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Orders</h1>
          <p>Every purchase, with the context you need.</p>
        </div>
        <span className="date-chip">{result.total} matching orders</span>
      </div>
      <section className="panel">
        <form className="filter-bar" action="/orders">
          <label>
            Search
            <input
              name="search"
              placeholder="Order or customer"
              defaultValue={params.search}
            />
          </label>
          <label>
            Status
            <select name="status" defaultValue={params.status}>
              <option value="">All statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
          <label>
            From (UTC)
            <input type="date" name="from" defaultValue={params.from} />
          </label>
          <label>
            To (UTC)
            <input type="date" name="to" defaultValue={params.to} />
          </label>
          {params.customerId && (
            <input type="hidden" name="customerId" value={params.customerId} />
          )}
          <button className="button" type="submit">
            Apply filters
          </button>
        </form>
        <OrdersTable rows={result.rows} />
        <Pagination
          total={result.total}
          page={page}
          limit={20}
          base="/orders"
          params={params}
        />
      </section>
      <p className="data-footnote">
        Amounts in USD · Dates in UTC · Revenue includes completed orders only
      </p>
    </>
  );
}
