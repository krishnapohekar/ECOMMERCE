import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Header, Footer } from "@/components/site/Chrome";
import { ProductCard } from "@/components/site/ProductCard";
import { listProducts, listStorefrontCategories } from "@/lib/shop.functions";

const featuredOpts = queryOptions({
  queryKey: ["featured"],
  queryFn: () => listProducts({ data: { featured: true, limit: 8 } }),
});
const categoriesOpts = queryOptions({
  queryKey: ["storefront-categories"],
  queryFn: () => listStorefrontCategories(),
});

export const Route = createFileRoute("/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(featuredOpts),
      context.queryClient.ensureQueryData(categoriesOpts),
    ]),
  component: Home,
  errorComponent: ({ error }) => <div className="p-12">Failed to load: {error.message}</div>,
});

function Home() {
  const { data: featured } = useSuspenseQuery(featuredOpts);
  const { data: categories } = useSuspenseQuery(categoriesOpts);

  return (
    <div className="min-h-screen">
      <Header />
      {/* Hero */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-2 md:py-32">
          <div className="flex flex-col justify-center">
            <div className="mb-6 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Autumn / Winter — Volume 01
            </div>
            <h1 className="font-display text-5xl leading-[1.05] md:text-7xl">
              Considered objects for everyday life.
            </h1>
            <p className="mt-6 max-w-md text-base text-muted-foreground">
              A small, slow studio shop of apparel, accessories, and home goods made to last and
              improve with use.
            </p>
            <div className="mt-10 flex gap-4">
              <Link
                to="/shop"
                className="bg-ink px-6 py-3 text-xs uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90"
              >
                Shop the collection
              </Link>
              <Link
                to="/about"
                className="border border-ink px-6 py-3 text-xs uppercase tracking-widest"
              >
                Our story
              </Link>
            </div>
          </div>
          <div className="aspect-[4/5] overflow-hidden bg-muted">
            <img
              src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600"
              alt="Studio editorial"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 flex items-end justify-between">
          <h2 className="font-display text-3xl md:text-4xl">Shop by category</h2>
          <Link to="/shop" className="ink-link text-xs uppercase tracking-widest">
            View all
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-4">
          {categories.slice(0, 4).map((c) => (
            <Link key={c.id} to="/shop" search={{ category: c.slug }} className="group">
              <div className="aspect-square overflow-hidden bg-muted">
                {c.image_url ? (
                  <img
                    src={c.image_url}
                    alt={c.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center font-display text-3xl text-muted-foreground/40">
                    {c.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="mt-3 font-display text-xl">{c.name}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-10 flex items-end justify-between">
            <h2 className="font-display text-3xl md:text-4xl">Featured pieces</h2>
            <Link to="/shop" className="ink-link text-xs uppercase tracking-widest">
              View all
            </Link>
          </div>
          <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Editorial split */}
      <section className="border-t border-border bg-muted/40">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 md:grid-cols-2 md:items-center">
          <div className="aspect-[5/6] overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1200"
              alt="Made by hand"
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              The studio
            </div>
            <h3 className="mt-4 font-display text-4xl">Made slowly, with intention.</h3>
            <p className="mt-6 text-muted-foreground">
              Each piece in our collection is developed in close partnership with small workshops.
              We use natural materials and finishing techniques that age beautifully — designed for
              long ownership, not seasonal turnover.
            </p>
            <Link
              to="/about"
              className="mt-8 inline-block ink-link text-xs uppercase tracking-widest"
            >
              Read more
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
