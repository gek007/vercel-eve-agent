import { requireProPage } from "@/lib/auth/page";
import { queryBusiness } from "@/lib/data/client";
import { businessSchema } from "@/lib/data/contracts";
import { CustomersTable, Pagination } from "@/components/business-tables";
import { AccessState } from "@/components/access-state";
export default async function Customers({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const caller = await requireProPage();
  const raw = await searchParams;
  const search = typeof raw.search === "string" ? raw.search : "";
  const page = raw.page === undefined ? 0 : Number(raw.page);
  const parsed = businessSchema.safeParse({
    operation: "customers",
    search,
    page,
    limit: 20,
  });
  if (!parsed.success)
    return (
      <AccessState
        title="Check your filters"
        message="Search must be under 100 characters and page must be a non-negative whole number."
      />
    );
  let result;
  try {
    result = await queryBusiness(caller, parsed.data);
  } catch {
    return (
      <AccessState message="We couldn’t retrieve customers. Please try again." />
    );
  }
  if (result.kind !== "customers") return null;
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Customers</h1>
          <p>The people behind your business.</p>
        </div>
        <span className="date-chip">{result.total} matching customers</span>
      </div>
      <section className="panel">
        <form className="filter-bar" action="/customers">
          <label>
            Find a customer
            <input
              type="search"
              name="search"
              placeholder="Name, company, email, or region"
              defaultValue={search}
            />
          </label>
          <button className="button" type="submit">
            Search customers
          </button>
        </form>
        <CustomersTable rows={result.rows} />
        <Pagination
          total={result.total}
          page={page}
          limit={20}
          base="/customers"
          params={{ search }}
        />
      </section>
    </>
  );
}
