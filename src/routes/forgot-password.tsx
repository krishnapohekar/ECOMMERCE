import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Header, Footer } from "@/components/site/Chrome";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({ component: Forgot });

function Forgot() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  };
  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-md px-6 py-20">
        <h1 className="font-display text-4xl">Reset password</h1>
        {sent ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Check your inbox for a password reset link.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-4">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-ink"
            />
            <button
              disabled={busy}
              className="w-full bg-ink py-3 text-xs uppercase tracking-widest text-primary-foreground disabled:opacity-50"
            >
              {busy ? "…" : "Send reset link"}
            </button>
          </form>
        )}
        <Link to="/login" className="mt-6 inline-block text-xs uppercase tracking-widest ink-link">
          Back to sign in
        </Link>
      </div>
      <Footer />
    </div>
  );
}
