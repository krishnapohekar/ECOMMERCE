import { createHmac, timingSafeEqual } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

function verifyWebhookSignature(rawBody: string, signature: string, secret: string) {
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

async function markOrderPaid({
  razorpayOrderId,
  razorpayPaymentId,
}: {
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
}) {
  if (!razorpayOrderId && !razorpayPaymentId) return 0;

  let query = supabaseAdmin
    .from("orders")
    .update({
      status: "paid" as const,
      paid_at: new Date().toISOString(),
      stripe_payment_intent: razorpayPaymentId,
    });

  if (razorpayPaymentId && razorpayOrderId) {
    query = query.or(
      `stripe_payment_intent.eq.${razorpayPaymentId},stripe_session_id.eq.${razorpayOrderId}`,
    );
  } else if (razorpayPaymentId) {
    query = query.eq("stripe_payment_intent", razorpayPaymentId);
  } else if (razorpayOrderId) {
    query = query.eq("stripe_session_id", razorpayOrderId);
  }

  const { data, error } = await query.select("id");
  if (error) throw error;
  return data?.length ?? 0;
}

export const Route = createFileRoute("/api/razorpay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!secret) return json({ error: "Webhook secret is not configured" }, 500);

        const signature = request.headers.get("x-razorpay-signature");
        if (!signature) return json({ error: "Missing Razorpay signature" }, 400);

        const rawBody = await request.text();
        if (!verifyWebhookSignature(rawBody, signature, secret)) {
          return json({ error: "Invalid Razorpay signature" }, 400);
        }

        const event = JSON.parse(rawBody);
        const payment = event?.payload?.payment?.entity;
        const order = event?.payload?.order?.entity;
        let updatedOrders = 0;

        if (event.event === "payment.captured" || event.event === "order.paid") {
          updatedOrders = await markOrderPaid({
            razorpayOrderId: payment?.order_id ?? order?.id,
            razorpayPaymentId: payment?.id,
          });
        }

        return json({ ok: true, event: event.event, updatedOrders });
      },
    },
  },
});
