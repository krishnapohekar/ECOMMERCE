import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getWishlist, toggleWishlist, addToCart } from "@/lib/shop.functions";
import { useAuth } from "@/lib/auth-context";
import { Header, Footer } from "@/components/site/Chrome";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";
import { useEffect } from "react";

export const Route = createFileRoute("/wishlist")({ component: Wishlist });

function Wishlist() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchW = useServerFn(getWishlist);
  const toggle = useServerFn(toggleWishlist);
  const add = useServerFn(addToCart);
  const { data } = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => fetchW(),
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: "always",
  });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="font-display text-5xl">Wishlist</h1>
        {!data || data.length === 0 ? (
          <div className="py-16 text-sm text-muted-foreground">
            Nothing saved yet.{" "}
            <Link to="/shop" className="ink-link">
              Browse the shop
            </Link>
            .
          </div>
        ) : (
          <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((row: any) => {
              const p = row.products;
              const img = Array.isArray(p?.images) ? p.images[0] : null;
              return (
                <div key={row.id}>
                  <Link
                    to="/product/$slug"
                    params={{ slug: p.slug }}
                    className="block aspect-[4/5] overflow-hidden bg-muted"
                  >
                    {img && <img src={img} alt={p.name} className="h-full w-full object-cover" />}
                  </Link>
                  <div className="mt-3 flex items-start justify-between">
                    <div>
                      <Link
                        to="/product/$slug"
                        params={{ slug: p.slug }}
                        className="font-display text-lg ink-link"
                      >
                        {p.name}
                      </Link>
                      <div className="text-sm">{formatPrice(p.price)}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={async () => {
                        await add({ data: { productId: p.id, quantity: 1 } });
                        qc.invalidateQueries({ queryKey: ["cart"] });
                        toast.success("Added to bag");
                      }}
                      className="flex-1 bg-ink py-2 text-xs uppercase tracking-widest text-primary-foreground"
                    >
                      Add to bag
                    </button>
                    <button
                      onClick={async () => {
                        await toggle({ data: { productId: p.id } });
                        qc.invalidateQueries({ queryKey: ["wishlist"] });
                      }}
                      className="border border-ink px-3 text-xs uppercase tracking-widest"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
