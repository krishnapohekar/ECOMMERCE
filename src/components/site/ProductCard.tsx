import { Link } from "@tanstack/react-router";
import { formatPrice } from "@/lib/format";

type P = {
  id: string;
  slug: string;
  name: string;
  price: number | string;
  compare_at_price?: number | string | null;
  images: any;
  short_description?: string | null;
  stock?: number | null;
};

export function ProductCard({ p }: { p: P }) {
  const img = Array.isArray(p.images) ? p.images[0] : null;
  const sale = p.compare_at_price && Number(p.compare_at_price) > Number(p.price);
  return (
    <Link to="/product/$slug" params={{ slug: p.slug }} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        {img ? (
          <img
            src={img}
            alt={p.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No image
          </div>
        )}
        {sale && (
          <span className="absolute left-3 top-3 bg-ink px-2 py-1 text-[10px] uppercase tracking-widest text-primary-foreground">
            Sale
          </span>
        )}
        {p.stock === 0 && (
          <span className="absolute right-3 top-3 bg-background px-2 py-1 text-[10px] uppercase tracking-widest">
            Sold out
          </span>
        )}
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <div className="font-display text-lg leading-tight">{p.name}</div>
          {p.short_description && (
            <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">
              {p.short_description}
            </div>
          )}
        </div>
        <div className="text-right text-sm">
          <div>{formatPrice(p.price)}</div>
          {sale && (
            <div className="text-xs text-muted-foreground line-through">
              {formatPrice(p.compare_at_price!)}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
