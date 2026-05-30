/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createHmac } from "node:crypto";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { ExternalPaymentGateway } from "./payment-service";

const addressSchema = z.object({
  id: z.string().optional(),
  full_name: z.string().min(1).max(120),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().max(100).optional(),
  postal_code: z.string().min(1).max(20),
  country: z.string().min(2).max(60),
  phone: z.string().max(40).optional(),
  is_default: z.boolean().optional(),
});

function throwIfError<T>(result: { data: T; error: any }): NonNullable<T> {
  if (result.error) throw result.error;
  return result.data as NonNullable<T>;
}

async function currentUser() {
  const request = getRequest();
  const authHeader = request?.headers?.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : "";
  if (!token) throw new Error("Please sign in to continue");

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) throw new Error("Your session expired. Please sign in again.");
  return data.user;
}

async function isAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw error;
  return data?.role === "admin";
}

async function requireAdmin() {
  const user = await currentUser();
  if (!(await isAdmin(user.id))) throw new Error("Admin access required");
  return user;
}

async function ensureProfile(user: { id: string; email?: string | null; user_metadata?: any }) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email ?? null,
        full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? "",
      },
      { onConflict: "id", ignoreDuplicates: true },
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

function imagesArray(images: unknown): string[] {
  return Array.isArray(images) ? images.filter((src): src is string => typeof src === "string") : [];
}

function calculateDiscount(coupon: any, subtotal: number) {
  if (!coupon || !coupon.is_active || subtotal < Number(coupon.min_subtotal)) {
    return { discount: 0, shippingOverride: false, valid: false };
  }
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
    return { discount: 0, shippingOverride: false, valid: false };
  }
  if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
    return { discount: 0, shippingOverride: false, valid: false };
  }
  if (coupon.type === "percent") {
    return {
      discount: +(subtotal * (Number(coupon.value) / 100)).toFixed(2),
      shippingOverride: false,
      valid: true,
    };
  }
  if (coupon.type === "fixed") {
    return {
      discount: Math.min(Number(coupon.value), subtotal),
      shippingOverride: false,
      valid: true,
    };
  }
  if (coupon.type === "free_shipping") {
    return { discount: 0, shippingOverride: true, valid: true };
  }
  return { discount: 0, shippingOverride: false, valid: false };
}

function orderWithPaymentMeta(order: any) {
  if (!order) return order;
  return {
    ...order,
    payment_type: order.stripe_session_id ?? (order.status === "paid" ? "online" : "cod"),
    payment_reference: order.stripe_payment_intent,
  };
}

export const listProducts = createServerFn({ method: "GET" })
  .inputValidator(
    (
      d:
        | {
            category?: string;
            featured?: boolean;
            limit?: number;
            q?: string;
            sort?: "newest" | "price-asc" | "price-desc" | "rating";
            minPrice?: number;
            maxPrice?: number;
            inStock?: boolean;
          }
        | undefined,
    ) =>
      z
        .object({
          category: z.string().optional(),
          featured: z.boolean().optional(),
          limit: z.number().int().positive().max(100).optional(),
          q: z.string().max(100).optional(),
          sort: z.enum(["newest", "price-asc", "price-desc", "rating"]).optional(),
          minPrice: z.number().min(0).optional(),
          maxPrice: z.number().min(0).optional(),
          inStock: z.boolean().optional(),
        })
        .parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    let query = supabaseAdmin.from("products").select("*, categories(*)").eq("is_active", true);
    if (data.featured) query = query.eq("is_featured", true);
    if (data.minPrice !== undefined) query = query.gte("price", data.minPrice);
    if (data.maxPrice !== undefined) query = query.lte("price", data.maxPrice);
    if (data.inStock) query = query.gt("stock", 0);
    if (data.q) {
      const q = data.q.replaceAll("%", "\\%").replaceAll("_", "\\_");
      query = query.or(`name.ilike.%${q}%,short_description.ilike.%${q}%,brand.ilike.%${q}%`);
    }
    if (data.category) {
      const { data: category, error } = await supabaseAdmin
        .from("categories")
        .select("id")
        .eq("slug", data.category)
        .maybeSingle();
      if (error) throw error;
      if (!category) return [];
      query = query.eq("category_id", category.id);
    }

    if (data.sort === "price-asc") query = query.order("price", { ascending: true });
    else if (data.sort === "price-desc") query = query.order("price", { ascending: false });
    else if (data.sort === "rating") query = query.order("rating_avg", { ascending: false });
    else query = query.order("created_at", { ascending: false });
    if (data.limit) query = query.limit(data.limit);

    return throwIfError(await query);
  });

export const listCategories = createServerFn({ method: "GET" }).handler(async () =>
  throwIfError(await supabaseAdmin.from("categories").select("*").order("sort_order")),
);

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const product = throwIfError(
      await supabaseAdmin
        .from("products")
        .select("*, categories(*)")
        .eq("slug", data.slug)
        .eq("is_active", true)
        .maybeSingle(),
    );
    if (!product) return null;

    const reviews = throwIfError(
      await supabaseAdmin
        .from("reviews")
        .select("*")
        .eq("product_id", product.id)
        .order("created_at", { ascending: false }),
    );
    return { product, reviews };
  });

export const submitReview = createServerFn({ method: "POST" })
  .inputValidator((d: { productId: string; rating: number; title?: string; body?: string }) =>
    z
      .object({
        productId: z.string(),
        rating: z.number().int().min(1).max(5),
        title: z.string().max(120).optional(),
        body: z.string().max(1000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const user = await currentUser();
    throwIfError(
      await supabaseAdmin.from("reviews").upsert(
        {
          product_id: data.productId,
          user_id: user.id,
          rating: data.rating,
          title: data.title ?? null,
          body: data.body ?? null,
        },
        { onConflict: "product_id,user_id" },
      ),
    );
    return { ok: true };
  });

export const searchProducts = createServerFn({ method: "GET" })
  .inputValidator((d: { q: string }) => z.object({ q: z.string().min(1).max(100) }).parse(d))
  .handler(async ({ data }) =>
    throwIfError(
      await supabaseAdmin
        .from("products")
        .select("*")
        .eq("is_active", true)
        .ilike("name", `%${data.q}%`)
        .limit(20),
    ),
  );

export const getCart = createServerFn({ method: "GET" }).handler(async () => {
  const user = await currentUser();
  return throwIfError(
    await supabaseAdmin
      .from("cart_items")
      .select("*, products(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
  );
});

export const addToCart = createServerFn({ method: "POST" })
  .inputValidator((d: { productId: string; quantity?: number }) =>
    z
      .object({ productId: z.string(), quantity: z.number().int().positive().max(99).default(1) })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const user = await currentUser();
    const product = throwIfError(
      await supabaseAdmin
        .from("products")
        .select("id, stock, is_active")
        .eq("id", data.productId)
        .maybeSingle(),
    );
    if (!product?.is_active) throw new Error("Product is unavailable");

    const existing = throwIfError(
      await supabaseAdmin
        .from("cart_items")
        .select("*")
        .eq("user_id", user.id)
        .eq("product_id", data.productId)
        .maybeSingle(),
    );
    const nextQuantity = (existing?.quantity ?? 0) + data.quantity;
    if (nextQuantity > product.stock) throw new Error(`Only ${product.stock} available`);

    if (existing) {
      throwIfError(
        await supabaseAdmin
          .from("cart_items")
          .update({ quantity: nextQuantity })
          .eq("id", existing.id),
      );
    } else {
      throwIfError(
        await supabaseAdmin
          .from("cart_items")
          .insert({ user_id: user.id, product_id: data.productId, quantity: data.quantity }),
      );
    }
    return { ok: true };
  });

export const updateCartItem = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; quantity: number }) =>
    z.object({ id: z.string(), quantity: z.number().int().min(0).max(99) }).parse(d),
  )
  .handler(async ({ data }) => {
    const user = await currentUser();
    const row = throwIfError(
      await supabaseAdmin
        .from("cart_items")
        .select("*, products(stock)")
        .eq("id", data.id)
        .eq("user_id", user.id)
        .maybeSingle(),
    );
    if (!row) return { ok: true };
    if (data.quantity === 0) {
      throwIfError(await supabaseAdmin.from("cart_items").delete().eq("id", row.id));
      return { ok: true };
    }
    const stock = Number((row as any).products?.stock ?? 0);
    if (data.quantity > stock) throw new Error(`Only ${stock} available`);
    throwIfError(await supabaseAdmin.from("cart_items").update({ quantity: data.quantity }).eq("id", row.id));
    return { ok: true };
  });

export const removeCartItem = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const user = await currentUser();
    throwIfError(
      await supabaseAdmin.from("cart_items").delete().eq("id", data.id).eq("user_id", user.id),
    );
    return { ok: true };
  });

export const getWishlist = createServerFn({ method: "GET" }).handler(async () => {
  const user = await currentUser();
  return throwIfError(
    await supabaseAdmin
      .from("wishlist_items")
      .select("*, products(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  );
});

export const toggleWishlist = createServerFn({ method: "POST" })
  .inputValidator((d: { productId: string }) => z.object({ productId: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const user = await currentUser();
    const existing = throwIfError(
      await supabaseAdmin
        .from("wishlist_items")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", data.productId)
        .maybeSingle(),
    );
    if (existing) {
      throwIfError(await supabaseAdmin.from("wishlist_items").delete().eq("id", existing.id));
      return { added: false };
    }
    throwIfError(
      await supabaseAdmin
        .from("wishlist_items")
        .insert({ user_id: user.id, product_id: data.productId }),
    );
    return { added: true };
  });

export const validateCoupon = createServerFn({ method: "GET" })
  .inputValidator((d: { code: string; subtotal: number }) =>
    z.object({ code: z.string().min(1).max(40), subtotal: z.number().min(0) }).parse(d),
  )
  .handler(async ({ data }) => {
    await currentUser();
    const code = data.code.trim().toUpperCase();
    const coupon = throwIfError(
      await supabaseAdmin.from("coupons").select("*").eq("code", code).maybeSingle(),
    );
    const result = calculateDiscount(coupon, data.subtotal);
    if (!result.valid) throw new Error("Promo code is not valid for this order");
    return {
      code,
      discount: result.discount,
      freeShipping: result.shippingOverride,
      type: coupon.type,
    };
  });

async function cartWithProducts(userId: string) {
  return throwIfError(
    await supabaseAdmin
      .from("cart_items")
      .select("*, products(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
  );
}

async function priceCart(cart: any[], couponCode?: string) {
  if (cart.length === 0) throw new Error("Cart is empty");
  let subtotal = 0;
  const items = cart.map((c) => {
    const product = c.products;
    if (!product?.is_active) throw new Error("Product unavailable");
    if (c.quantity > product.stock) throw new Error(`${product.name} only has ${product.stock} left in stock`);
    subtotal += Number(product.price) * c.quantity;
    return { row: c, product };
  });

  let discount = 0;
  let shipping = subtotal >= 75 ? 0 : 8;
  let coupon: any = null;
  if (couponCode) {
    coupon = throwIfError(
      await supabaseAdmin
        .from("coupons")
        .select("*")
        .eq("code", couponCode.trim().toUpperCase())
        .maybeSingle(),
    );
    const result = calculateDiscount(coupon, subtotal);
    if (!result.valid) throw new Error("Promo code is not valid for this order");
    discount = result.discount;
    if (result.shippingOverride) shipping = 0;
  }
  const tax = +((subtotal - discount) * 0.08).toFixed(2);
  const total = +(subtotal - discount + shipping + tax).toFixed(2);
  return { items, subtotal, discount, shipping, tax, total, coupon };
}

async function createSupabaseOrder({
  userId,
  address,
  couponCode,
  paymentMethodOption,
  paymentReference,
  paymentSessionId,
}: {
  userId: string;
  address: z.infer<typeof addressSchema>;
  couponCode?: string;
  paymentMethodOption: "online" | "cod";
  paymentReference?: string;
  paymentSessionId?: string;
}) {
  const cart = await cartWithProducts(userId);
  const priced = await priceCart(cart, couponCode);
  const status = paymentMethodOption === "online" ? "paid" : "pending";
  const order = throwIfError(
    await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId,
        status,
        subtotal: priced.subtotal,
        discount: priced.discount,
        shipping: priced.shipping,
        tax: priced.tax,
        total: priced.total,
        currency: "INR",
        coupon_code: priced.coupon?.code ?? null,
        shipping_address: address,
        stripe_session_id: paymentSessionId ?? paymentMethodOption,
        stripe_payment_intent: paymentReference ?? null,
        paid_at: status === "paid" ? new Date().toISOString() : null,
      })
      .select()
      .single(),
  );

  const orderItems = priced.items.map(({ row, product }) => ({
    order_id: order.id,
    product_id: product.id,
    name: product.name,
    price: product.price,
    quantity: row.quantity,
    image_url: imagesArray(product.images)[0] ?? null,
  }));
  throwIfError(await supabaseAdmin.from("order_items").insert(orderItems));

  await Promise.all(
    priced.items.map(({ row, product }) =>
      supabaseAdmin
        .from("products")
        .update({ stock: Math.max(0, Number(product.stock) - Number(row.quantity)) })
        .eq("id", product.id),
    ),
  );
  if (priced.coupon) {
    throwIfError(
      await supabaseAdmin
        .from("coupons")
        .update({ used_count: Number(priced.coupon.used_count) + 1 })
        .eq("id", priced.coupon.id),
    );
  }
  throwIfError(await supabaseAdmin.from("cart_items").delete().eq("user_id", userId));

  return order;
}

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      address: z.infer<typeof addressSchema>;
      couponCode?: string;
      paymentMethodOption?: "online" | "cod";
      paymentReference?: string;
    }) =>
      z
        .object({
          address: addressSchema.omit({ id: true, is_default: true }),
          couponCode: z.string().max(40).optional(),
          paymentMethodOption: z.enum(["online", "cod"]).default("online"),
          paymentReference: z.string().optional(),
        })
        .parse(d),
  )
  .handler(async ({ data }) => {
    const user = await currentUser();
    const order = await createSupabaseOrder({
      userId: user.id,
      address: data.address,
      couponCode: data.couponCode,
      paymentMethodOption: data.paymentMethodOption,
      paymentReference: data.paymentReference,
      paymentSessionId: data.paymentMethodOption,
    });

    return {
      orderId: order.id,
      orderNumber: order.order_number,
      paymentType: data.paymentMethodOption,
    };
  });

export const listMyOrders = createServerFn({ method: "GET" }).handler(async () => {
  const user = await currentUser();
  const query = supabaseAdmin.from("orders").select("*").order("created_at", { ascending: false });
  const rows = (await isAdmin(user.id))
    ? throwIfError(await query)
    : throwIfError(await query.eq("user_id", user.id));
  return rows.map(orderWithPaymentMeta);
});

export const getOrderDetail = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const user = await currentUser();
    let query = supabaseAdmin.from("orders").select("*").eq("id", data.id);
    if (!(await isAdmin(user.id))) query = query.eq("user_id", user.id);
    const order = throwIfError(await query.maybeSingle());
    if (!order) return null;
    const items = throwIfError(
      await supabaseAdmin.from("order_items").select("*").eq("order_id", order.id),
    );
    return { order: orderWithPaymentMeta(order), items };
  });

export const payOrder = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      id: string;
      paymentMethod: string;
      cardDetails?: { cardNumber: string; cardHolder: string; expiry: string; cvv: string };
      vpa?: string;
    }) =>
      z
        .object({
          id: z.string(),
          paymentMethod: z.enum(["card", "upi", "netbanking"]),
          cardDetails: z
            .object({
              cardNumber: z.string(),
              cardHolder: z.string(),
              expiry: z.string(),
              cvv: z.string(),
            })
            .optional(),
          vpa: z.string().optional(),
        })
        .parse(d),
  )
  .handler(async ({ data }) => {
    const user = await currentUser();
    const order = throwIfError(
      await supabaseAdmin
        .from("orders")
        .select("*")
        .eq("id", data.id)
        .eq("user_id", user.id)
        .maybeSingle(),
    );
    if (!order) throw new Error("Order not found");
    if (order.status !== "pending") throw new Error("Order is not in pending status");

    let reference = "NET-" + crypto.randomUUID().slice(0, 8).toUpperCase();
    if (data.paymentMethod === "card") {
      if (!data.cardDetails) throw new Error("Card details are required");
      const response = await ExternalPaymentGateway.authorizeCard({
        ...data.cardDetails,
        amount: order.total,
        orderNumber: order.order_number,
      });
      if (!response.authorized) throw new Error(response.declineReason || "Card transaction declined");
      reference = response.transactionId;
    } else if (data.paymentMethod === "upi") {
      if (!data.vpa) throw new Error("UPI VPA ID is required");
      const response = await ExternalPaymentGateway.authorizeUpi({
        vpa: data.vpa,
        amount: order.total,
        orderNumber: order.order_number,
      });
      if (!response.authorized) throw new Error(response.declineReason || "UPI transaction declined");
      reference = response.transactionId;
    }

    throwIfError(
      await supabaseAdmin
        .from("orders")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          stripe_session_id: data.paymentMethod,
          stripe_payment_intent: reference,
        })
        .eq("id", order.id),
    );
    return { ok: true, status: "paid", reference };
  });

export const getProfile = createServerFn({ method: "GET" }).handler(async () => {
  const user = await currentUser();
  const profile = throwIfError(
    await supabaseAdmin.from("profiles").select("*").eq("id", user.id).maybeSingle(),
  );
  return profile ?? (await ensureProfile(user));
});

export const updateProfile = createServerFn({ method: "POST" })
  .inputValidator((d: { full_name?: string; phone?: string }) =>
    z
      .object({ full_name: z.string().max(120).optional(), phone: z.string().max(40).optional() })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const user = await currentUser();
    throwIfError(
      await supabaseAdmin
        .from("profiles")
        .upsert({ id: user.id, email: user.email ?? null, ...data })
        .eq("id", user.id),
    );
    return { ok: true };
  });

export const listAddresses = createServerFn({ method: "GET" }).handler(async () => {
  const user = await currentUser();
  return throwIfError(
    await supabaseAdmin
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  );
});

export const saveAddress = createServerFn({ method: "POST" })
  .inputValidator((d: z.infer<typeof addressSchema>) => addressSchema.parse(d))
  .handler(async ({ data }) => {
    const user = await currentUser();
    if (data.is_default) {
      throwIfError(
        await supabaseAdmin.from("addresses").update({ is_default: false }).eq("user_id", user.id),
      );
    }
    const address = { ...data, user_id: user.id, line2: data.line2 ?? null, phone: data.phone ?? null };
    if (data.id) {
      throwIfError(
        await supabaseAdmin.from("addresses").update(address).eq("id", data.id).eq("user_id", user.id),
      );
    } else {
      const { id, ...insertAddress } = address;
      void id;
      throwIfError(await supabaseAdmin.from("addresses").insert(insertAddress));
    }
    return { ok: true };
  });

export const deleteAddress = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const user = await currentUser();
    throwIfError(
      await supabaseAdmin.from("addresses").delete().eq("id", data.id).eq("user_id", user.id),
    );
    return { ok: true };
  });

export const initiateOnlinePayment = createServerFn({ method: "POST" })
  .inputValidator((d: { couponCode?: string }) =>
    z.object({ couponCode: z.string().max(40).optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const user = await currentUser();
    const cart = await cartWithProducts(user.id);
    const priced = await priceCart(cart, data.couponCode);
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new Error("Missing Razorpay keys. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.");
    }

    const amountInPaise = Math.round(priced.total * 100);
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt: `sheetal-${user.id.slice(0, 8)}-${Date.now()}`.slice(0, 40),
        notes: {
          user_id: user.id,
          coupon_code: data.couponCode ?? "",
        },
      }),
    });
    const razorpayOrder = await response.json();
    if (!response.ok) {
      throw new Error(razorpayOrder?.error?.description ?? "Unable to create Razorpay order");
    }

    return {
      amount: priced.total,
      currency: "INR",
      keyId,
      name: "Sheetal",
      description: "Sheetal order payment",
      razorpayOrderId: razorpayOrder.id as string,
    };
  });

export const verifyRazorpayPaymentAndPlaceOrder = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      address: z.infer<typeof addressSchema>;
      couponCode?: string;
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    }) =>
      z
        .object({
          address: addressSchema.omit({ id: true, is_default: true }),
          couponCode: z.string().max(40).optional(),
          razorpayOrderId: z.string().min(1),
          razorpayPaymentId: z.string().min(1),
          razorpaySignature: z.string().min(1),
        })
        .parse(d),
  )
  .handler(async ({ data }) => {
    const user = await currentUser();
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) throw new Error("Missing RAZORPAY_KEY_SECRET in .env.");

    const expectedSignature = createHmac("sha256", keySecret)
      .update(`${data.razorpayOrderId}|${data.razorpayPaymentId}`)
      .digest("hex");
    if (expectedSignature !== data.razorpaySignature) {
      throw new Error("Razorpay payment verification failed");
    }

    const order = await createSupabaseOrder({
      userId: user.id,
      address: data.address,
      couponCode: data.couponCode,
      paymentMethodOption: "online",
      paymentReference: data.razorpayPaymentId,
      paymentSessionId: data.razorpayOrderId,
    });

    return {
      orderId: order.id,
      orderNumber: order.order_number,
      paymentType: "online",
      razorpayOrderId: data.razorpayOrderId,
      razorpayPaymentId: data.razorpayPaymentId,
    };
  });

export const adminUpdateOrderStatus = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; status: string }) =>
    z.object({ id: z.string(), status: z.string() }).parse(d),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const status = (data.status === "canceled" ? "cancelled" : data.status) as
      | "pending"
      | "paid"
      | "processing"
      | "shipped"
      | "delivered"
      | "cancelled"
      | "refunded";
    throwIfError(await supabaseAdmin.from("orders").update({ status }).eq("id", data.id));
    return { ok: true, status };
  });

export const adminUpdateProduct = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      id: string;
      name: string;
      sku: string;
      price: number;
      stock: number;
      brand: string;
      is_featured: boolean;
    }) =>
      z
        .object({
          id: z.string(),
          name: z.string().min(1),
          sku: z.string().min(1),
          price: z.number().positive(),
          stock: z.number().nonnegative(),
          brand: z.string().min(1),
          is_featured: z.boolean(),
        })
        .parse(d),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    throwIfError(
      await supabaseAdmin
        .from("products")
        .update({
          name: data.name,
          sku: data.sku,
          price: data.price,
          stock: data.stock,
          brand: data.brand,
          is_featured: data.is_featured,
        })
        .eq("id", data.id),
    );
    return { ok: true };
  });

export const adminAddProduct = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      name: string;
      slug: string;
      short_description: string;
      description: string;
      sku: string;
      price: number;
      stock: number;
      category_id: string;
      brand: string;
      is_featured: boolean;
      image_url?: string;
    }) =>
      z
        .object({
          name: z.string().min(1),
          slug: z.string().min(1),
          short_description: z.string().min(1),
          description: z.string().min(1),
          sku: z.string().min(1),
          price: z.number().positive(),
          stock: z.number().nonnegative(),
          category_id: z.string().min(1),
          brand: z.string().min(1),
          is_featured: z.boolean(),
          image_url: z.string().url().optional(),
        })
        .parse(d),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { image_url, ...product } = data;
    const row = throwIfError(
      await supabaseAdmin
        .from("products")
        .insert({
          ...product,
          images: [
            image_url ?? "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=1200",
          ],
          is_active: true,
        })
        .select("id")
        .single(),
    );
    return { ok: true, id: row.id };
  });
