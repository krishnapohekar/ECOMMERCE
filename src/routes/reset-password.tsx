import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Header, Footer } from "@/components/site/Chrome";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({ component: Reset });

function Reset() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    navigate({ to: "/account" });
  };
  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-md px-6 py-20">
        <h1 className="font-display text-4xl">Set a new password</h1>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            className="w-full border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-ink"
          />
          <button
            disabled={busy}
            className="w-full bg-ink py-3 text-xs uppercase tracking-widest text-primary-foreground disabled:opacity-50"
          >
            {busy ? "…" : "Update password"}
          </button>
        </form>
      </div>
      <Footer />
    </div>
  );
}
