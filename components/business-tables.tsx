import Link from "next/link";
import type { CustomerPage, OrderPage } from "@/lib/data/contracts";
import { money, utcDate } from "@/lib/format";
export function Status({ status }: { status: string }) {
  return (
    <span className={`status ${status}`}>
      <span />
      {status}
    </span>
  );
}
export function OrdersTable({ rows }: { rows: OrderPage["rows"] }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Date (UTC)</th>
            <th>Status</th>
            <th className="numeric">Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => (
            <tr key={o.fixtureKey}>
              <td className="record-id">{o.fixtureKey}</td>
              <td>
                <strong>{o.customerName}</strong>
                <small>{o.company}</small>
              </td>
              <td>{utcDate(o.createdAt)}</td>
              <td>
                <Status status={o.status} />
              </td>
              <td className="numeric">{money(o.totalCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <p className="no-rows">No orders match your filters.</p>
      )}
    </div>
  );
}
export function CustomersTable({ rows }: { rows: CustomerPage["rows"] }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Customer</th>
            <th>Company</th>
            <th>Region</th>
            <th className="numeric">Orders</th>
            <th className="numeric">Completed revenue</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.fixtureKey}>
              <td>
                <strong>
                  <Link
                    href={`/orders?customerId=${encodeURIComponent(c.fixtureKey)}`}
                  >
                    {c.name}
                  </Link>
                </strong>
                <small>{c.email}</small>
              </td>
              <td>{c.company}</td>
              <td>{c.region}</td>
              <td className="numeric">{c.orderCount}</td>
              <td className="numeric">{money(c.revenueCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <p className="no-rows">No customers match your search.</p>
      )}
    </div>
  );
}
export function Pagination({
  total,
  page,
  limit,
  base,
  params,
}: {
  total: number;
  page: number;
  limit: number;
  base: string;
  params: Record<string, string>;
}) {
  const url = (p: number) =>
    `${base}?${new URLSearchParams({ ...params, page: String(p) })}`;
  return (
    <div className="pagination">
      <span>
        {total
          ? `${page * limit + 1}–${Math.min((page + 1) * limit, total)} of ${total}`
          : "0 results"}
      </span>
      <div>
        {page > 0 ? (
          <Link className="button secondary small" href={url(page - 1)}>
            Previous
          </Link>
        ) : (
          <span className="button secondary small disabled">Previous</span>
        )}
        {(page + 1) * limit < total ? (
          <Link className="button secondary small" href={url(page + 1)}>
            Next
          </Link>
        ) : (
          <span className="button secondary small disabled">Next</span>
        )}
      </div>
    </div>
  );
}
