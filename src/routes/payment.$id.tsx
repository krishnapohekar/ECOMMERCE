/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Header, Footer } from "@/components/site/Chrome";
import { getOrderDetail, payOrder } from "@/lib/shop.functions";
import { formatPrice } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import {
  CreditCard,
  Smartphone,
  Landmark,
  CheckCircle,
  ShieldCheck,
  Loader2,
  ArrowRight,
  X,
} from "lucide-react";

export const Route = createFileRoute("/payment/$id")({ component: PaymentPage });

type PaymentMethod = "card" | "upi" | "netbanking";

function PaymentPage() {
  const { id } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchOrder = useServerFn(getOrderDetail);
  const executePayment = useServerFn(payOrder);

  const { data, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => fetchOrder({ data: { id } }),
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Card Form State
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");

  // UPI Form State
  const [upiId, setUpiId] = useState("");

  // Net Banking State
  const [selectedBank, setSelectedBank] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (data?.order && data.order.status === "paid") {
      setIsSuccess(true);
    }
  }, [data]);

  // Handle auto-redirect countdown on success
  useEffect(() => {
    if (isSuccess && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isSuccess && countdown === 0) {
      navigate({ to: "/account/orders/$id", params: { id } });
    }
  }, [isSuccess, countdown, navigate, id]);

  const order = data?.order;
  const items = data?.items ?? [];

  // Card formatting
  const handleCardNumberChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    const formatted = digits.match(/.{1,4}/g)?.join(" ") ?? digits;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 4);
    if (cleaned.length >= 2) {
      setExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2)}`);
    } else {
      setExpiry(cleaned);
    }
  };

  const handleCvvChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 3);
    setCvv(digits);
  };

  // Payment steps text
  const processingSteps = [
    "Establishing encrypted handshakes...",
    "Validating secure payment tokens...",
    "Authorizing transaction with issuing bank...",
    "Securing credit ledger ledgers...",
    "Finalizing order documentation...",
  ];

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validations
    if (paymentMethod === "card") {
      if (cardNumber.replace(/\s/g, "").length !== 16) {
        toast.error("Please enter a valid 16-digit card number");
        return;
      }
      if (expiry.length !== 5) {
        toast.error("Please enter expiry date in MM/YY format");
        return;
      }
      const [month, year] = expiry.split("/");
      const m = parseInt(month, 10);
      if (isNaN(m) || m < 1 || m > 12) {
        toast.error("Please enter a valid month (01-12)");
        return;
      }
      if (cvv.length < 3) {
        toast.error("Please enter a valid 3-digit CVV");
        return;
      }
      if (!cardName.trim()) {
        toast.error("Please enter the cardholder's name");
        return;
      }
    } else if (paymentMethod === "upi") {
      if (!upiId.includes("@") || upiId.length < 5) {
        toast.error("Please enter a valid UPI ID (e.g. name@bank)");
        return;
      }
    } else if (paymentMethod === "netbanking") {
      if (!selectedBank) {
        toast.error("Please select a bank from the list");
        return;
      }
    }

    // Start Simulation
    setIsProcessing(true);
    setPaymentStep(0);

    const stepInterval = setInterval(() => {
      setPaymentStep((prev) => {
        if (prev < processingSteps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(stepInterval);
          return prev;
        }
      });
    }, 1000);

    try {
      // Simulate at least 4.5 seconds of secure authorization
      await new Promise((resolve) => setTimeout(resolve, 4800));

      const payload: any = { id, paymentMethod };
      if (paymentMethod === "card") {
        payload.cardDetails = {
          cardNumber: cardNumber.replace(/\s/g, ""),
          cardHolder: cardName,
          expiry,
          cvv,
        };
      } else if (paymentMethod === "upi") {
        payload.vpa = upiId;
      }

      await executePayment({ data: payload });
      clearInterval(stepInterval);

      qc.invalidateQueries({ queryKey: ["cart"] });
      qc.invalidateQueries({ queryKey: ["order", id] });
      qc.invalidateQueries({ queryKey: ["orders"] });

      toast.success("Payment authorized successfully");
      setIsSuccess(true);
    } catch (err: any) {
      clearInterval(stepInterval);
      setErrorMessage(err.message || "Failed to process payment. Please try again.");
      toast.error(err.message || "Payment declined");
    } finally {
      setIsProcessing(false);
    }
  };

  const popularBanks = [
    { id: "chase", name: "Chase Bank" },
    { id: "bofa", name: "Bank of America" },
    { id: "wells", name: "Wells Fargo" },
    { id: "citi", name: "Citibank" },
    { id: "capone", name: "Capital One" },
    { id: "usbank", name: "U.S. Bank" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col justify-between">
        <Header />
        <div className="flex flex-1 items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-ink" />
            <div className="text-sm text-muted-foreground uppercase tracking-widest">
              Loading order details...
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col justify-between">
        <Header />
        <div className="mx-auto max-w-md px-6 py-32 text-center flex-1 flex flex-col justify-center">
          <h1 className="font-display text-4xl">Order not found</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            The requested order does not exist or has expired.
          </p>
          <Link
            to="/shop"
            className="mt-6 inline-block bg-ink px-6 py-3 text-xs uppercase tracking-widest text-primary-foreground"
          >
            Return to shop
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-muted/10">
        <Header />
        <div className="mx-auto max-w-lg px-6 py-20 flex-1 flex flex-col items-center justify-center">
          <div className="w-full border border-border bg-background p-8 text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-ink/5">
              <CheckCircle className="h-10 w-10 text-ink animate-pulse" />
            </div>
            <div className="space-y-2">
              <h1 className="font-display text-4xl">Payment Authorized</h1>
              <p className="text-sm text-muted-foreground">
                Your payment has been secured and order {order.order_number} is processing.
              </p>
            </div>

            <div className="editorial-rule" />

            <div className="text-left space-y-3 text-sm bg-muted/20 p-4 font-mono text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Order Number:</span>
                <span>{order.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment method:</span>
                <span className="uppercase">{paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount paid:</span>
                <span>{formatPrice(order.total)}</span>
              </div>
              <div className="flex justify-between">
                <span>Transaction ID:</span>
                <span>TXN-{id.slice(0, 8).toUpperCase()}</span>
              </div>
            </div>

            <div className="editorial-rule" />

            <div className="space-y-4">
              <button
                onClick={() => navigate({ to: "/account/orders/$id", params: { id } })}
                className="w-full bg-ink px-6 py-3 text-xs uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
              >
                <span>View Order Status</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <p className="text-xs text-muted-foreground">
                Redirecting to order dashboard in <span className="font-bold">{countdown}</span>{" "}
                seconds...
              </p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-muted/10">
        <Header />
        <div className="mx-auto max-w-md px-6 py-24 flex-1 flex flex-col items-center justify-center">
          <div className="w-full border border-border bg-background p-8 text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted/30">
              <Loader2 className="h-8 w-8 animate-spin text-ink" />
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-3xl">Securing Payment</h2>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Please do not refresh or click back
              </p>
            </div>

            <div className="bg-muted/30 p-5 min-h-[90px] flex items-center justify-center border border-border/50">
              <p className="text-sm font-medium transition-all duration-300 animate-pulse text-ink">
                {processingSteps[paymentStep]}
              </p>
            </div>

            <div className="flex justify-center items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4" />
              <span>PCI-DSS Compliant 256-bit Encryption</span>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const address = order.shipping_address as any;

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-5xl">Payment</h1>
          <span className="border border-border px-2.5 py-0.5 text-xs font-mono tracking-widest uppercase text-muted-foreground mt-2">
            PENDING
          </span>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Order reference: {order.order_number} · Please complete your transaction below.
        </p>

        <div className="mt-10 grid gap-12 md:grid-cols-[1fr_360px]">
          {/* Left Column: Form Options */}
          <div className="space-y-8">
            {errorMessage && (
              <div className="border border-red-200 bg-red-50/50 p-4 text-sm text-red-800 flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-red-100 p-1">
                  <X className="h-3.5 w-3.5 text-red-800" />
                </div>
                <div>
                  <div className="font-semibold uppercase tracking-wider text-[10px]">
                    Authorization Declined
                  </div>
                  <div className="mt-1">{errorMessage}</div>
                </div>
              </div>
            )}
            <div>
              <h2 className="mb-4 font-display text-2xl">Select Payment Method</h2>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`flex flex-col items-center justify-center gap-3 border p-5 text-center transition-all ${
                    paymentMethod === "card"
                      ? "border-ink bg-ink/5 ring-1 ring-ink"
                      : "border-border bg-transparent hover:border-ink/50"
                  }`}
                >
                  <CreditCard className="h-5 w-5" />
                  <span className="text-xs uppercase tracking-wider font-semibold">Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("upi")}
                  className={`flex flex-col items-center justify-center gap-3 border p-5 text-center transition-all ${
                    paymentMethod === "upi"
                      ? "border-ink bg-ink/5 ring-1 ring-ink"
                      : "border-border bg-transparent hover:border-ink/50"
                  }`}
                >
                  <Smartphone className="h-5 w-5" />
                  <span className="text-xs uppercase tracking-wider font-semibold">
                    UPI QR / ID
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("netbanking")}
                  className={`flex flex-col items-center justify-center gap-3 border p-5 text-center transition-all ${
                    paymentMethod === "netbanking"
                      ? "border-ink bg-ink/5 ring-1 ring-ink"
                      : "border-border bg-transparent hover:border-ink/50"
                  }`}
                >
                  <Landmark className="h-5 w-5" />
                  <span className="text-xs uppercase tracking-wider font-semibold">
                    Net Banking
                  </span>
                </button>
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-6">
              {/* Payment Content */}
              {paymentMethod === "card" && (
                <div className="space-y-4 border border-border p-6 bg-muted/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Credit or Debit Card
                    </span>
                    <div className="flex gap-1.5 opacity-60">
                      <div className="h-6 w-9 rounded bg-muted border border-border flex items-center justify-center font-mono text-[9px] font-bold">
                        VISA
                      </div>
                      <div className="h-6 w-9 rounded bg-muted border border-border flex items-center justify-center font-mono text-[9px] font-bold">
                        MC
                      </div>
                      <div className="h-6 w-9 rounded bg-muted border border-border flex items-center justify-center font-mono text-[9px] font-bold">
                        AMEX
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block">
                      <span className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
                        Cardholder Name
                      </span>
                      <input
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full border border-border bg-background px-4 py-3 text-sm outline-none focus:border-ink"
                        required
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
                        Card Number
                      </span>
                      <input
                        value={cardNumber}
                        onChange={(e) => handleCardNumberChange(e.target.value)}
                        placeholder="0000 0000 0000 0000"
                        className="w-full border border-border bg-background px-4 py-3 text-sm font-mono outline-none focus:border-ink"
                        required
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-4">
                      <label className="block">
                        <span className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
                          Expiry Date
                        </span>
                        <input
                          value={expiry}
                          onChange={(e) => handleExpiryChange(e.target.value)}
                          placeholder="MM/YY"
                          className="w-full border border-border bg-background px-4 py-3 text-sm font-mono outline-none focus:border-ink"
                          required
                        />
                      </label>

                      <label className="block">
                        <span className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
                          CVV
                        </span>
                        <input
                          value={cvv}
                          type="password"
                          onChange={(e) => handleCvvChange(e.target.value)}
                          placeholder="•••"
                          className="w-full border border-border bg-background px-4 py-3 text-sm font-mono outline-none focus:border-ink"
                          required
                        />
                      </label>
                    </div>
                  </div>
                  <div className="mt-4 text-[10px] text-muted-foreground leading-relaxed border-t border-border/30 pt-3">
                    <strong>Gateway Test Cards:</strong> Try card ending in <code>4444</code> for
                    insufficient funds, <code>0000</code> for fraud risk alert, <code>9999</code>{" "}
                    for expired card, or any other card (e.g. <code>4111 ... 1111</code>) to
                    approve. Luhn validation is active.
                  </div>
                </div>
              )}

              {paymentMethod === "upi" && (
                <div className="space-y-6 border border-border p-6 bg-muted/10">
                  <div className="flex flex-col sm:flex-row gap-6 items-center">
                    {/* Mock QR Code */}
                    <div className="w-40 h-40 bg-background border border-border p-2 flex flex-col items-center justify-center relative">
                      <svg
                        className="w-full h-full text-ink"
                        viewBox="0 0 100 100"
                        fill="currentColor"
                      >
                        <rect x="0" y="0" width="25" height="25" />
                        <rect x="5" y="5" width="15" height="15" fill="white" />
                        <rect x="9" y="9" width="7" height="7" />

                        <rect x="75" y="0" width="25" height="25" />
                        <rect x="80" y="5" width="15" height="15" fill="white" />
                        <rect x="84" y="9" width="7" height="7" />

                        <rect x="0" y="75" width="25" height="25" />
                        <rect x="5" y="80" width="15" height="15" fill="white" />
                        <rect x="9" y="84" width="7" height="7" />

                        {/* Random barcode grids to look like QR code */}
                        <rect x="35" y="10" width="10" height="5" />
                        <rect x="55" y="5" width="5" height="15" />
                        <rect x="40" y="30" width="20" height="5" />
                        <rect x="10" y="45" width="15" height="10" />
                        <rect x="80" y="40" width="5" height="20" />
                        <rect x="35" y="55" width="10" height="15" />
                        <rect x="60" y="60" width="15" height="5" />
                        <rect x="45" y="80" width="20" height="10" />
                        <rect x="75" y="75" width="10" height="5" />
                        <rect x="85" y="85" width="10" height="10" />
                      </svg>
                      <div className="absolute inset-0 bg-background/5 hover:bg-transparent flex items-center justify-center transition-all duration-300">
                        <span className="bg-ink text-primary-foreground text-[10px] uppercase tracking-widest px-2 py-1 select-none font-bold">
                          Scan to Pay
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-4 w-full">
                      <div className="text-xs text-muted-foreground leading-relaxed">
                        Scan the QR code with any UPI app (Google Pay, PhonePe, BHIM, etc.) or enter
                        your UPI ID below.
                      </div>

                      <label className="block">
                        <span className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
                          UPI ID
                        </span>
                        <input
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="e.g. username@bank"
                          className="w-full border border-border bg-background px-4 py-3 text-sm outline-none focus:border-ink"
                        />
                      </label>
                      <div className="mt-3 text-[10px] text-muted-foreground leading-relaxed border-t border-border/30 pt-3">
                        <strong>Gateway Test UPI VPAs:</strong> Try <code>decline@bank</code> for
                        insufficient funds, <code>fraud@bank</code> for fraud risk alert,{" "}
                        <code>timeout@bank</code> to test gateway timeout, or any other UPI ID (e.g.{" "}
                        <code>customer@oksbi</code>) to approve. Standard VPA format check is
                        active.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === "netbanking" && (
                <div className="space-y-4 border border-border p-6 bg-muted/10">
                  <span className="mb-2 block text-xs uppercase tracking-widest text-muted-foreground">
                    Select popular bank
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    {popularBanks.map((bank) => (
                      <button
                        key={bank.id}
                        type="button"
                        onClick={() => setSelectedBank(bank.id)}
                        className={`border px-4 py-3 text-left text-sm transition-all ${
                          selectedBank === bank.id
                            ? "border-ink bg-ink/5 font-semibold"
                            : "border-border bg-background hover:border-ink/50"
                        }`}
                      >
                        {bank.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-ink px-6 py-4 text-xs uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90 flex items-center justify-center gap-2 font-medium"
              >
                <span>Authorize Payment — {formatPrice(order.total)}</span>
              </button>

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4" />
                <span>Your transaction is safe & secure.</span>
              </div>
            </form>
          </div>

          {/* Right Column: Order Summary */}
          <aside className="h-fit border border-border p-6">
            <div className="font-display text-xl">Order Summary</div>
            <div className="editorial-rule my-4" />

            {/* Items list */}
            <div className="max-h-64 space-y-4 overflow-auto">
              {items.map((item: any) => (
                <div key={item.id} className="flex justify-between items-start text-sm gap-2">
                  <div className="flex gap-3">
                    <div className="h-12 w-10 flex-shrink-0 bg-muted">
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <div className="font-medium line-clamp-1">{item.name}</div>
                      <div className="text-xs text-muted-foreground">Qty {item.quantity}</div>
                    </div>
                  </div>
                  <span className="font-mono text-xs">
                    {formatPrice(Number(item.price) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="editorial-rule my-4" />

            {/* Totals */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Discount</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>{order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span>{formatPrice(order.tax)}</span>
              </div>
            </div>

            <div className="editorial-rule my-4" />
            <div className="flex justify-between font-display text-lg">
              <span>Total to Pay</span>
              <span>{formatPrice(order.total)}</span>
            </div>

            {/* Shipping details */}
            {address && (
              <div className="mt-6 bg-muted/20 p-4 border border-border/50 text-xs space-y-1 text-muted-foreground">
                <div className="font-semibold text-ink uppercase tracking-wider text-[10px] mb-1">
                  Shipping Details
                </div>
                <div>{address.full_name}</div>
                <div>
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ""}
                </div>
                <div>
                  {address.city}, {address.state} {address.postal_code}
                </div>
                <div>{address.country}</div>
              </div>
            )}
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  );
}
