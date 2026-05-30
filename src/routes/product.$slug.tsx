import { createFileRoute, useNavigate, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Header, Footer } from "@/components/site/Chrome";
import { getProductBySlug, addToCart, submitReview, toggleWishlist } from "@/lib/shop.functions";
import { formatPrice } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import { Heart, Star } from "lucide-react";

const opts = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: () => getProductBySlug({ data: { slug } }),
  });

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ context, params }) => {
    const res = await context.queryClient.ensureQueryData(opts(params.slug));
    if (!res) throw notFound();
    return res;
  },
  head: ({ loaderData, params }) => {
    const p = loaderData?.product;
    const title = p ? `${p.name} — Sheetal` : "Product — Sheetal";
    const img =
      Array.isArray(p?.images) && typeof p.images[0] === "string"
        ? (p.images[0] as string)
        : undefined;
    return {
      meta: [
        { title },
        { name: "description", content: p?.short_description ?? "Sheetal product" },
        { property: "og:title", content: title },
        { property: "og:description", content: p?.short_description ?? "" },
        { property: "og:type", content: "product" },
        { property: "og:url", content: `/product/${params.slug}` },
        ...(img ? [{ property: "og:image", content: img }] : []),
      ],
      links: [{ rel: "canonical", href: `/product/${params.slug}` }],
      scripts: p
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Product",
                name: p.name,
                image: img,
                description: p.short_description,
                offers: {
                  "@type": "Offer",
                  price: p.price,
                  priceCurrency: "USD",
                  availability:
                    p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                },
              }),
            },
          ]
        : [],
    };
  },
  component: ProductPage,
  errorComponent: ({ error }) => <div className="p-12">Failed to load: {error.message}</div>,
  notFoundComponent: () => <div className="p-12 text-center">Product not found.</div>,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(opts(slug));
  const p = data!.product;
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const add = useServerFn(addToCart);
  const wish = useServerFn(toggleWishlist);
  const review = useServerFn(submitReview);
  const [qty, setQty] = useState(1);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: "", body: "" });
  const [busy, setBusy] = useState(false);

  const images = (Array.isArray(p.images) ? p.images : []) as string[];
  const sale = p.compare_at_price && Number(p.compare_at_price) > Number(p.price);

  const handleAdd = async () => {
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    setBusy(true);
    try {
      await add({ data: { productId: p.id, quantity: qty } });
      qc.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Added to bag");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleWish = async () => {
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    try {
      const r = await wish({ data: { productId: p.id } });
      toast.success(r.added ? "Saved" : "Removed");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    try {
      await review({ data: { productId: p.id, ...reviewForm } });
      await qc.invalidateQueries({ queryKey: ["product", slug] });
      setReviewForm({ rating: 5, title: "", body: "" });
      toast.success("Review saved");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-12 md:grid-cols-2 md:py-16">
        <div className="space-y-4">
          {images.length === 0 ? (
            <div className="aspect-[4/5] bg-muted" />
          ) : (
            images.map((src, i) => (
              <div key={i} className="aspect-[4/5] overflow-hidden bg-muted">
                <img src={src} alt={p.name} className="h-full w-full object-cover" />
              </div>
            ))
          )}
        </div>
        <div className="md:sticky md:top-24 md:self-start">
          {p.categories?.name && (
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {p.categories.name}
            </div>
          )}
          <h1 className="mt-3 font-display text-4xl md:text-5xl">{p.name}</h1>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-xl">{formatPrice(p.price)}</span>
            {sale && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(p.compare_at_price!)}
              </span>
            )}
          </div>
          {p.rating_count > 0 && (
            <div className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="h-4 w-4 fill-current" /> {Number(p.rating_avg).toFixed(1)} (
              {p.rating_count})
            </div>
          )}
          <div className="editorial-rule my-8" />
          <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
            {p.description ?? p.short_description}
          </p>

          <div className="mt-10 flex items-stretch gap-3">
            <div className="flex items-center border border-ink">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2">
                −
              </button>
              <span className="w-10 text-center text-sm">{qty}</span>
              <button onClick={() => setQty(Math.min(p.stock, qty + 1))} className="px-3 py-2">
                +
              </button>
            </div>
            <button
              onClick={handleAdd}
              disabled={busy || p.stock === 0}
              className="flex-1 bg-ink px-6 py-3 text-xs uppercase tracking-widest text-primary-foreground disabled:opacity-50"
            >
              {p.stock === 0 ? "Sold out" : busy ? "Adding…" : "Add to bag"}
            </button>
            <button onClick={handleWish} aria-label="Wishlist" className="border border-ink px-4">
              <Heart className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-6 space-y-1 text-xs text-muted-foreground">
            <div>Free shipping on orders over $75.</div>
            <div>30-day returns.</div>
            {p.sku && <div>SKU: {p.sku}</div>}
          </div>

          <div className="editorial-rule my-10" />
          <section>
            <h2 className="font-display text-2xl">Reviews</h2>
            <form onSubmit={handleReview} className="mt-4 space-y-3">
              <select
                value={reviewForm.rating}
                onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                className="w-full border border-border bg-background px-3 py-2 text-sm"
              >
                {[5, 4, 3, 2, 1].map((rating) => (
                  <option key={rating} value={rating}>
                    {rating} stars
                  </option>
                ))}
              </select>
              <input
                value={reviewForm.title}
                onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                placeholder="Review title"
                className="w-full border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-ink"
              />
              <textarea
                value={reviewForm.body}
                onChange={(e) => setReviewForm({ ...reviewForm, body: e.target.value })}
                placeholder="Share your thoughts"
                rows={4}
                className="w-full border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-ink"
              />
              <button className="bg-ink px-5 py-3 text-xs uppercase tracking-widest text-primary-foreground">
                Submit review
              </button>
            </form>
            <div className="mt-8 space-y-5">
              {data!.reviews.length === 0 ? (
                <div className="text-sm text-muted-foreground">No reviews yet.</div>
              ) : (
                data!.reviews.map((r: any) => (
                  <article key={r.id} className="border-t border-border pt-4">
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-4 w-4 fill-current" /> {r.rating}
                    </div>
                    {r.title && <h3 className="mt-2 font-display text-xl">{r.title}</h3>}
                    {r.body && (
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
                    )}
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
