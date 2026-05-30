import { Link } from "@tanstack/react-router";
import { ShoppingBag, Heart, User, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export function Header() {
  const { user, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <button onClick={() => setOpen(!open)} className="md:hidden" aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <Link to="/" className="font-display text-2xl tracking-tight">
          Sheetal
        </Link>
        <nav className="hidden gap-8 text-sm md:flex">
          <Link to="/shop" className="ink-link">
            Shop
          </Link>
          <Link to="/shop" search={{ category: "apparel" } as any} className="ink-link">
            Apparel
          </Link>
          <Link to="/shop" search={{ category: "home" } as any} className="ink-link">
            Home
          </Link>
          <Link to="/about" className="ink-link">
            About
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link to="/wishlist" aria-label="Wishlist">
            <Heart className="h-5 w-5" />
          </Link>
          <Link to="/cart" aria-label="Cart">
            <ShoppingBag className="h-5 w-5" />
          </Link>
          <Link to={user ? "/account" : "/login"} aria-label="Account">
            <User className="h-5 w-5" />
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              className="text-xs uppercase tracking-widest text-muted-foreground hover:text-ink font-semibold border border-border/80 px-2 py-0.5 transition-all"
            >
              Admin
            </Link>
          )}
        </div>
      </div>
      {open && (
        <nav className="border-t border-border bg-background px-6 py-4 md:hidden">
          <div className="flex flex-col gap-3 text-sm">
            <Link to="/shop" onClick={() => setOpen(false)}>
              Shop
            </Link>
            <Link to="/about" onClick={() => setOpen(false)}>
              About
            </Link>
            <Link to="/cart" onClick={() => setOpen(false)}>
              Cart
            </Link>
            <Link to={user ? "/account" : "/login"} onClick={() => setOpen(false)}>
              Account
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-32 border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-4">
          <div>
            <div className="font-display text-2xl">Sheetal</div>
            <p className="mt-3 text-sm text-muted-foreground">
              Considered objects for everyday life.
            </p>
          </div>
          <div>
            <div className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">Shop</div>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/shop" className="ink-link">
                  All products
                </Link>
              </li>
              <li>
                <Link to="/shop" search={{ category: "apparel" } as any} className="ink-link">
                  Apparel
                </Link>
              </li>
              <li>
                <Link to="/shop" search={{ category: "home" } as any} className="ink-link">
                  Home
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">Help</div>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="ink-link">
                  About
                </Link>
              </li>
              <li>
                <Link to="/account" className="ink-link">
                  Account
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">
              Newsletter
            </div>
            <p className="text-sm text-muted-foreground">
              New arrivals and quiet updates, sent monthly.
            </p>
            <form className="mt-3 flex border-b border-border" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="your@email.com"
                className="w-full bg-transparent py-2 text-sm outline-none"
              />
              <button className="text-xs uppercase tracking-widest">Join</button>
            </form>
          </div>
        </div>
        <div className="editorial-rule my-10" />
        <div className="flex flex-col justify-between gap-2 text-xs text-muted-foreground md:flex-row">
          <div>© {new Date().getFullYear()} Sheetal. All rights reserved.</div>
          <div>Crafted with care.</div>
        </div>
      </div>
    </footer>
  );
}
