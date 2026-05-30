import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getOrderDetail } from "@/lib/shop.functions";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/account/orders/$id")({ component: OrderDetail });

function OrderDetail() {
  const { id } = Route.useParams();
  const fetchOrder = useServerFn(getOrderDetail);
  const { data, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => fetchOrder({ data: { id } }),
  });

  if (isLoading) return <div className="py-12 text-muted-foreground">Loading...</div>;
  if (!data) return <div className="py-12 text-sm text-muted-foreground">Order not found.</div>;

  const address = data.order.shipping_address as any;

  return (
    <div>
      <Link
        to="/account/orders"
        className="ink-link text-xs uppercase tracking-widest text-muted-foreground"
      >
        Back to orders
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">{data.order.order_number}</h1>
          <div className="mt-2 text-sm text-muted-foreground">
            {new Date(data.order.created_at).toLocaleString()} · {data.order.status}
          </div>
        </div>
        <div className="font-display text-2xl">{formatPrice(data.order.total)}</div>
      </div>

      <div className="mt-8 divide-y divide-border border-y border-border">
        {data.items.map((item: any) => (
          <div key={item.id} className="flex items-center gap-4 py-4">
            <div className="h-20 w-16 flex-shrink-0 bg-muted">
              {item.image_url && (
                <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
              )}
            </div>
            <div className="flex-1">
              <div className="font-display text-lg">{item.name}</div>
              <div className="text-sm text-muted-foreground">Qty {item.quantity}</div>
            </div>
            <div className="text-sm">{formatPrice(Number(item.price) * item.quantity)}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <section>
          <h2 className="font-display text-2xl">Shipping</h2>
          {address && (
            <div className="mt-3 text-sm text-muted-foreground">
              <div>{address.full_name}</div>
              <div>
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}
              </div>
              <div>
                {address.city}, {address.state} {address.postal_code}
              </div>
              <div>{address.country}</div>
              {address.phone && <div className="mt-2">{address.phone}</div>}
            </div>
          )}
        </section>
        <section className="space-y-2 text-sm">
          <h2 className="mb-3 font-display text-2xl">Totals</h2>
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatPrice(data.order.subtotal)}</span>
          </div>
          {Number(data.order.discount) > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Discount</span>
              <span>-{formatPrice(data.order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-muted-foreground">
            <span>Shipping</span>
            <span>{formatPrice(data.order.shipping)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Tax</span>
            <span>{formatPrice(data.order.tax)}</span>
          </div>
          <div className="editorial-rule my-3" />
          <div className="flex justify-between font-display text-xl">
            <span>Total</span>
            <span>{formatPrice(data.order.total)}</span>
          </div>
        </section>
      </div>
    </div>
  );
}
