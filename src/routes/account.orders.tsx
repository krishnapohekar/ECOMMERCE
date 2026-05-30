import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyOrders } from "@/lib/shop.functions";
import { formatDateIST, formatPrice } from "@/lib/format";

export const Route = createFileRoute("/account/orders")({ component: Orders });

function Orders() {
  const fetchOrders = useServerFn(listMyOrders);
  const { data, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => fetchOrders(),
    staleTime: 0,
    refetchOnMount: "always",
  });
  return (
    <div>
      <h1 className="font-display text-4xl">Orders</h1>
      {isLoading ? (
        <div className="py-12 text-muted-foreground">Loading…</div>
      ) : !data || data.length === 0 ? (
        <div className="py-12 text-sm text-muted-foreground">
          No orders yet.{" "}
          <Link to="/shop" className="ink-link">
            Start shopping
          </Link>
          .
        </div>
      ) : (
        <div className="mt-8 divide-y divide-border border-y border-border">
          {data.map((o: any) => (
            <Link
              key={o.id}
              to="/account/orders/$id"
              params={{ id: o.id }}
              className="flex items-center justify-between py-4 hover:bg-muted/40"
            >
              <div>
                <div className="font-mono text-sm">{o.order_number}</div>
                <div className="text-xs text-muted-foreground">
                  {formatDateIST(o.created_at)} · {o.status}
                </div>
              </div>
              <div className="text-sm">{formatPrice(o.total)}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
