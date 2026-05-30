import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { Header, Footer } from "@/components/site/Chrome";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/account" });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        await signUp(email, password, name);
        toast.success("Account created");
      } else {
        await signIn(email, password);
        toast.success("Welcome back");
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-md px-6 py-20">
        <h1 className="text-center font-display text-4xl">
          {mode === "signin" ? "Sign in" : "Create account"}
        </h1>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Use your account email and a password with at least 6 characters.
        </div>
        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="w-full border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-ink"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Email"
            className="w-full border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-ink"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Password"
            className="w-full border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-ink"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-ink py-3 text-xs uppercase tracking-widest text-primary-foreground disabled:opacity-50"
          >
            {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
        <div className="mt-6 flex justify-between text-xs">
          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="ink-link uppercase tracking-widest"
          >
            {mode === "signin" ? "Create account" : "Have an account?"}
          </button>
          {mode === "signin" && (
            <Link to="/forgot-password" className="ink-link uppercase tracking-widest">
              Forgot?
            </Link>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
