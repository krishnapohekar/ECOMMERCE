import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Header, Footer } from "@/components/site/Chrome";
import { getCart, updateCartItem, removeCartItem } from "@/lib/shop.functions";
import { formatPrice } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import { useMemo } from "react";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/cart")({ component: CartPage });

function CartPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchCart = useServerFn(getCart);
  const update = useServerFn(updateCartItem);
  const remove = useServerFn(removeCartItem);
  const { data, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: () => fetchCart(),
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const subtotal = useMemo(
    () =>
      (data ?? []).reduce(
        (s: number, r: any) => s + Number(r.products?.price ?? 0) * r.quantity,
        0,
      ),
    [data],
  );

  if (!loading && !user) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-md px-6 py-32 text-center">
          <h1 className="font-display text-4xl">Your bag</h1>
          <p className="mt-3 text-sm text-muted-foreground">Sign in to view your bag.</p>
          <Link
            to="/login"
            className="mt-6 inline-block bg-ink px-6 py-3 text-xs uppercase tracking-widest text-primary-foreground"
          >
            Sign in
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="font-display text-5xl">Your bag</h1>
        {isLoading ? (
          <div className="py-20 text-center text-muted-foreground">Loading…</div>
        ) : !data || data.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-muted-foreground">Your bag is empty.</p>
            <Link
              to="/shop"
              className="mt-6 inline-block ink-link text-xs uppercase tracking-widest"
            >
              Continue shopping
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-12 md:grid-cols-[1fr_360px]">
            <div className="divide-y divide-border border-y border-border">
              {data.map((row: any) => {
                const p = row.products;
                const img = Array.isArray(p?.images) ? p.images[0] : null;
                return (
                  <div key={row.id} className="flex gap-4 py-6">
                    <div className="h-28 w-24 flex-shrink-0 overflow-hidden bg-muted">
                      {img && <img src={img} alt={p.name} className="h-full w-full object-cover" />}
                    </div>
                    <div className="flex-1">
                      <Link
                        to="/product/$slug"
                        params={{ slug: p.slug }}
                        className="font-display text-lg ink-link"
                      >
                        {p.name}
                      </Link>
                      <div className="mt-1 text-sm">{formatPrice(p.price)}</div>
                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex items-center border border-border">
                          <button
                            onClick={async () => {
                              await update({
                                data: { id: row.id, quantity: Math.max(0, row.quantity - 1) },
                              });
                              qc.invalidateQueries({ queryKey: ["cart"] });
                            }}
                            className="px-2 py-1 text-sm"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-sm">{row.quantity}</span>
                          <button
                            onClick={async () => {
                              await update({ data: { id: row.id, quantity: row.quantity + 1 } });
                              qc.invalidateQueries({ queryKey: ["cart"] });
                            }}
                            className="px-2 py-1 text-sm"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={async () => {
                            await remove({ data: { id: row.id } });
                            qc.invalidateQueries({ queryKey: ["cart"] });
                            toast.success("Removed");
                          }}
                          className="ml-2 text-muted-foreground hover:text-ink"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-sm">{formatPrice(Number(p.price) * row.quantity)}</div>
                  </div>
                );
              })}
            </div>
            <aside className="h-fit border border-border p-6">
              <div className="font-display text-xl">Order summary</div>
              <div className="editorial-rule my-4" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>{subtotal >= 75 ? "Free" : formatPrice(8)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Estimated tax</span>
                  <span>{formatPrice(subtotal * 0.08)}</span>
                </div>
              </div>
              <div className="editorial-rule my-4" />
              <div className="flex justify-between font-display text-lg">
                <span>Total</span>
                <span>{formatPrice(subtotal + (subtotal >= 75 ? 0 : 8) + subtotal * 0.08)}</span>
              </div>
              <button
                onClick={() => navigate({ to: "/checkout" })}
                className="mt-6 w-full bg-ink px-6 py-3 text-xs uppercase tracking-widest text-primary-foreground"
              >
                Checkout
              </button>
            </aside>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
