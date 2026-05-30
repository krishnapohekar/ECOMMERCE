/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Header, Footer } from "@/components/site/Chrome";
import {
  getCart,
  listAddresses,
  placeOrder,
  validateCoupon,
  initiateOnlinePayment,
  verifyRazorpayPaymentAndPlaceOrder,
} from "@/lib/shop.functions";
import { formatPrice } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/checkout")({ component: CheckoutPage });

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  handler: (response: RazorpayResponse) => void | Promise<void>;
  modal?: { ondismiss?: () => void };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

function loadRazorpayCheckout() {
  return new Promise<void>((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Razorpay Checkout"));
    document.body.appendChild(script);
  });
}

function CheckoutPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchCart = useServerFn(getCart);
  const fetchAddresses = useServerFn(listAddresses);
  const place = useServerFn(placeOrder);
  const checkCoupon = useServerFn(validateCoupon);
  const initiatePayment = useServerFn(initiateOnlinePayment);
  const verifyPayment = useServerFn(verifyRazorpayPaymentAndPlaceOrder);

  const { data: cart } = useQuery({
    queryKey: ["cart"],
    queryFn: () => fetchCart(),
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: "always",
  });
  const { data: addresses } = useQuery({
    queryKey: ["addresses"],
    queryFn: () => fetchAddresses(),
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const [form, setForm] = useState({
    full_name: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "US",
    phone: "",
  });
  const [coupon, setCoupon] = useState("");
  const [couponResult, setCouponResult] = useState<{
    code: string;
    discount: number;
    freeShipping: boolean;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [paymentOption, setPaymentOption] = useState<"online" | "cod">("online");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  const subtotal = useMemo(
    () =>
      (cart ?? []).reduce(
        (sum: number, row: any) => sum + Number(row.products?.price ?? 0) * row.quantity,
        0,
      ),
    [cart],
  );
  const shipping = couponResult?.freeShipping || subtotal >= 75 ? 0 : 8;
  const discount = couponResult?.discount ?? 0;
  const tax = +((subtotal - discount) * 0.08).toFixed(2);
  const total = +(subtotal - discount + shipping + tax).toFixed(2);

  useEffect(() => {
    const address = addresses?.find((a: any) => a.is_default) ?? addresses?.[0];
    if (address && !form.line1) {
      setForm({
        full_name: address.full_name ?? "",
        line1: address.line1 ?? "",
        line2: address.line2 ?? "",
        city: address.city ?? "",
        state: address.state ?? "",
        postal_code: address.postal_code ?? "",
        country: address.country ?? "US",
        phone: address.phone ?? "",
      });
    }
  }, [addresses, form.line1]);

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    try {
      const result = await checkCoupon({ data: { code: coupon, subtotal } });
      setCouponResult(result);
      toast.success("Promo code applied");
    } catch (err: any) {
      setCouponResult(null);
      toast.error(err.message);
    }
  };

  const openRazorpayCheckout = async () => {
    const orderDetails = await initiatePayment({
      data: { couponCode: couponResult?.code ?? (coupon || undefined) },
    });
    await loadRazorpayCheckout();
    if (!window.Razorpay) throw new Error("Razorpay Checkout did not initialize");

    const checkout = new window.Razorpay({
      key: orderDetails.keyId,
      amount: Math.round(orderDetails.amount * 100),
      currency: orderDetails.currency,
      name: orderDetails.name,
      description: orderDetails.description,
      order_id: orderDetails.razorpayOrderId,
      prefill: {
        name: form.full_name,
        email: user?.email,
        contact: form.phone,
      },
      notes: { coupon_code: couponResult?.code ?? coupon },
      theme: { color: "#111111" },
      modal: {
        ondismiss: () => {
          setBusy(false);
          toast.message("Payment cancelled");
        },
      },
      handler: async (response) => {
        try {
          setBusy(true);
          const r = await verifyPayment({
            data: {
              address: form,
              couponCode: couponResult?.code ?? (coupon || undefined),
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            },
          });
          qc.invalidateQueries({ queryKey: ["cart"] });
          qc.invalidateQueries({ queryKey: ["orders"] });
          toast.success(`Payment successful! Order ${r.orderNumber} placed.`);
          navigate({ to: "/account/orders/$id", params: { id: r.orderId } });
        } catch (err: any) {
          toast.error(err.message || "Payment verification failed");
        } finally {
          setBusy(false);
        }
      },
    });

    checkout.open();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);

    if (paymentOption === "cod") {
      try {
        const r = await place({
          data: {
            address: form,
            couponCode: couponResult?.code ?? (coupon || undefined),
            paymentMethodOption: "cod",
          },
        });
        qc.invalidateQueries({ queryKey: ["cart"] });
        toast.success(`Order ${r.orderNumber} placed (Cash on Delivery)`);
        navigate({ to: "/account/orders/$id", params: { id: r.orderId } });
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setBusy(false);
      }
      return;
    }

    try {
      await openRazorpayCheckout();
      setBusy(false);
    } catch (err: any) {
      toast.error(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="font-display text-5xl">Checkout</h1>
        <div className="mt-3 text-xs text-muted-foreground">
          Checkout is connected to your Supabase catalog, cart, orders, and Razorpay.
        </div>
        <form onSubmit={submit} className="mt-10 grid gap-12 md:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <section>
              <h2 className="mb-4 font-display text-2xl">Shipping address</h2>
              {addresses && addresses.length > 0 && (
                <label className="mb-4 block">
                  <span className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
                    Saved address
                  </span>
                  <select
                    className="w-full border border-border bg-background px-4 py-3 text-sm outline-none focus:border-ink"
                    onChange={(e) => {
                      const address = addresses.find((a: any) => a.id === e.target.value);
                      if (!address) return;
                      setForm({
                        full_name: address.full_name ?? "",
                        line1: address.line1 ?? "",
                        line2: address.line2 ?? "",
                        city: address.city ?? "",
                        state: address.state ?? "",
                        postal_code: address.postal_code ?? "",
                        country: address.country ?? "US",
                        phone: address.phone ?? "",
                      });
                    }}
                  >
                    {addresses.map((a: any) => (
                      <option key={a.id} value={a.id}>
                        {a.full_name}, {a.line1}, {a.city}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" v={form.full_name} on={(v) => setForm({ ...form, full_name: v })} required full />
                <Field label="Address" v={form.line1} on={(v) => setForm({ ...form, line1: v })} required full />
                <Field label="Apt, suite (optional)" v={form.line2} on={(v) => setForm({ ...form, line2: v })} full />
                <Field label="City" v={form.city} on={(v) => setForm({ ...form, city: v })} required />
                <Field label="State / Region" v={form.state} on={(v) => setForm({ ...form, state: v })} />
                <Field label="Postal code" v={form.postal_code} on={(v) => setForm({ ...form, postal_code: v })} required />
                <Field label="Country" v={form.country} on={(v) => setForm({ ...form, country: v })} required />
                <Field label="Phone" v={form.phone} on={(v) => setForm({ ...form, phone: v })} full />
              </div>
            </section>

            <section>
              <h2 className="mb-4 font-display text-2xl">Promo code</h2>
              <div className="flex gap-2">
                <input
                  value={coupon}
                  onChange={(e) => {
                    setCoupon(e.target.value);
                    setCouponResult(null);
                  }}
                  placeholder="e.g. WELCOME10"
                  className="w-full border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-ink"
                />
                <button type="button" onClick={applyCoupon} className="border border-ink px-4 text-xs uppercase tracking-widest">
                  Apply
                </button>
              </div>
              {couponResult && <div className="mt-2 text-sm text-muted-foreground">{couponResult.code} applied.</div>}
            </section>

            <section>
              <h2 className="mb-4 font-display text-2xl">Payment Option</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPaymentOption("online")}
                  className={`flex flex-col items-start gap-1.5 border p-4 text-left transition-all ${
                    paymentOption === "online"
                      ? "border-ink bg-ink/5 ring-1 ring-ink"
                      : "border-border bg-transparent hover:border-ink/50"
                  }`}
                >
                  <span className="text-xs uppercase tracking-wider font-semibold">Pay Online</span>
                  <span className="text-xs text-muted-foreground">Razorpay Checkout.</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentOption("cod")}
                  className={`flex flex-col items-start gap-1.5 border p-4 text-left transition-all ${
                    paymentOption === "cod"
                      ? "border-ink bg-ink/5 ring-1 ring-ink"
                      : "border-border bg-transparent hover:border-ink/50"
                  }`}
                >
                  <span className="text-xs uppercase tracking-wider font-semibold">Cash on Delivery</span>
                  <span className="text-xs text-muted-foreground">Pay with cash or UPI on delivery.</span>
                </button>
              </div>
            </section>
          </div>

          <aside className="h-fit border border-border p-6">
            <div className="font-display text-xl">Summary</div>
            <div className="editorial-rule my-4" />
            <div className="max-h-64 space-y-3 overflow-auto">
              {(cart ?? []).map((r: any) => (
                <div key={r.id} className="flex justify-between text-sm">
                  <span className="truncate pr-2">
                    {r.products?.name} x {r.quantity}
                  </span>
                  <span>{formatPrice(Number(r.products?.price) * r.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="editorial-rule my-4" />
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Discount</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span>{formatPrice(tax)}</span>
              </div>
            </div>
            <div className="editorial-rule my-4" />
            <div className="flex justify-between font-display text-lg">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
            <button
              type="submit"
              disabled={busy || !cart || cart.length === 0}
              className="mt-6 w-full bg-ink px-6 py-3 text-xs uppercase tracking-widest text-primary-foreground disabled:opacity-50"
            >
              {busy ? "Processing..." : paymentOption === "online" ? "Pay with Razorpay" : "Place order"}
            </button>
            <Link to="/cart" className="mt-3 block text-center text-xs uppercase tracking-widest text-muted-foreground ink-link">
              Back to bag
            </Link>
          </aside>
        </form>
      </div>
      <Footer />
    </div>
  );
}

function Field({
  label,
  v,
  on,
  required,
  full,
}: {
  label: string;
  v: string;
  on: (value: string) => void;
  required?: boolean;
  full?: boolean;
}) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        value={v}
        onChange={(e) => on(e.target.value)}
        required={required}
        className="w-full border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-ink"
      />
    </label>
  );
}
