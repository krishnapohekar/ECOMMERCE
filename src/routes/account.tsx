import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Header, Footer } from "@/components/site/Chrome";
import { useEffect } from "react";

export const Route = createFileRoute("/account")({ component: AccountLayout });

function AccountLayout() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);
  if (!user) return null;
  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-12 md:grid-cols-[220px_1fr]">
        <aside>
          <div className="mb-6 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Account
          </div>
          <nav className="flex flex-col gap-2 text-sm">
            <Link
              to="/account"
              activeOptions={{ exact: true }}
              activeProps={{ className: "underline underline-offset-4" }}
            >
              Overview
            </Link>
            <Link to="/account/orders" activeProps={{ className: "underline underline-offset-4" }}>
              Orders
            </Link>
            <Link to="/wishlist" activeProps={{ className: "underline underline-offset-4" }}>
              Wishlist
            </Link>
            <button
              onClick={signOut}
              className="mt-6 text-left text-muted-foreground hover:text-ink"
            >
              Sign out
            </button>
          </nav>
        </aside>
        <div>
          <Outlet />
        </div>
      </div>
      <Footer />
    </div>
  );
}
