/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { Search } from "lucide-react";
import { Header, Footer } from "@/components/site/Chrome";
import { ProductCard } from "@/components/site/ProductCard";
import { listProducts, listCategories } from "@/lib/shop.functions";

const emptyToUndefined = (val: unknown) => (val === "" ? undefined : val);

const searchSchema = z.object({
  category: z.string().optional(),
  q: z.preprocess(emptyToUndefined, z.string().optional()),
  sort: z.preprocess(
    emptyToUndefined,
    z.enum(["newest", "price-asc", "price-desc", "rating"]).optional(),
  ),
  minPrice: z.preprocess(emptyToUndefined, z.coerce.number().optional()),
  maxPrice: z.preprocess(emptyToUndefined, z.coerce.number().optional()),
  inStock: z.preprocess(emptyToUndefined, z.coerce.boolean().optional()),
});

export const Route = createFileRoute("/shop")({
  validateSearch: (s) => searchSchema.parse(s),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    Promise.all([
      context.queryClient.ensureQueryData(productsOpts(deps)),
      context.queryClient.ensureQueryData(catsOpts()),
    ]),
  head: ({ params }) => ({
    meta: [
      { title: "Shop — Sheetal" },
      { name: "description", content: "Browse apparel, accessories, and home goods from Sheetal." },
      { property: "og:title", content: "Shop — Sheetal" },
      { property: "og:url", content: "/shop" },
    ],
    links: [{ rel: "canonical", href: "/shop" }],
  }),
  component: Shop,
  errorComponent: ({ error }) => <div className="p-12">Failed to load: {error.message}</div>,
});

const productsOpts = (filters: z.infer<typeof searchSchema>) =>
  queryOptions({ queryKey: ["products", filters], queryFn: () => listProducts({ data: filters }) });
const catsOpts = () => queryOptions({ queryKey: ["categories"], queryFn: () => listCategories() });

function Shop() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { data: products } = useSuspenseQuery(productsOpts(search));
  const { data: cats } = useSuspenseQuery(catsOpts());
  const activeFilters = Boolean(
    search.q || search.minPrice || search.maxPrice || search.inStock || search.sort,
  );

  const handleFilterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = formData.get("q") as string;
    const minPrice = formData.get("minPrice") as string;
    const maxPrice = formData.get("maxPrice") as string;
    const sort = formData.get("sort") as string;
    const inStock = formData.get("inStock") === "true";

    navigate({
      to: "/shop",
      search: (prev: any) => ({
        ...prev,
        q: q || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        sort: sort || undefined,
        inStock: inStock || undefined,
      }),
    });
  };

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-12">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            The Collection
          </div>
          <h1 className="mt-3 font-display text-5xl md:text-6xl">Shop</h1>
        </div>

        <form
          className="mb-6 grid gap-3 border-y border-border py-4 md:grid-cols-[1fr_160px_160px_170px_130px]"
          onSubmit={handleFilterSubmit}
        >
          {search.category && <input type="hidden" name="category" value={search.category} />}
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="q"
              defaultValue={search.q ?? ""}
              placeholder="Search products"
              className="h-11 w-full border border-border bg-transparent pl-10 pr-3 text-sm outline-none focus:border-ink"
            />
          </label>
          <input
            name="minPrice"
            type="number"
            min="0"
            defaultValue={search.minPrice ?? ""}
            placeholder="Min price"
            className="h-11 border border-border bg-transparent px-3 text-sm outline-none focus:border-ink"
          />
          <input
            name="maxPrice"
            type="number"
            min="0"
            defaultValue={search.maxPrice ?? ""}
            placeholder="Max price"
            className="h-11 border border-border bg-transparent px-3 text-sm outline-none focus:border-ink"
          />
          <select
            name="sort"
            defaultValue={search.sort ?? "newest"}
            className="h-11 border border-border bg-background px-3 text-sm outline-none focus:border-ink"
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="rating">Top rated</option>
          </select>
          <button className="h-11 bg-ink px-4 text-xs uppercase tracking-widest text-primary-foreground">
            Filter
          </button>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input
              name="inStock"
              type="checkbox"
              value="true"
              defaultChecked={!!search.inStock}
              className="h-4 w-4 accent-ink"
            />
            In stock only
          </label>
          {activeFilters && (
            <Link
              to="/shop"
              search={search.category ? { category: search.category } : {}}
              className="text-sm text-muted-foreground ink-link md:col-span-3"
            >
              Clear search and filters
            </Link>
          )}
        </form>

        <div className="mb-10 flex flex-wrap items-center gap-2">
          <Link
            to="/shop"
            className={`px-3 py-1 text-xs uppercase tracking-widest ${!search.category ? "bg-ink text-primary-foreground" : "ink-link"}`}
          >
            All
          </Link>
          {cats.map((c) => (
            <Link
              key={c.id}
              to="/shop"
              search={{ ...search, category: c.slug }}
              className={`px-3 py-1 text-xs uppercase tracking-widest ${search.category === c.slug ? "bg-ink text-primary-foreground" : "ink-link"}`}
            >
              {c.name}
            </Link>
          ))}
        </div>

        {products.length === 0 ? (
          <div className="py-32 text-center text-muted-foreground">No products here yet.</div>
        ) : (
          <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} p={p as any} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
