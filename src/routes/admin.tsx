/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { Header, Footer } from "@/components/site/Chrome";
import { formatDateIST, formatDateTimeIST, formatPrice } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import {
  listMyOrders,
  listProducts,
  listCategories,
  adminUpdateOrderStatus,
  adminUpdateProduct,
  adminRemoveProduct,
  adminAddProduct,
} from "@/lib/shop.functions";
import {
  TrendingUp,
  Package,
  AlertTriangle,
  FileText,
  DollarSign,
  Plus,
  Loader2,
  Edit2,
  Trash2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export const Route = createFileRoute("/admin")({ component: AdminPage });

type ActiveTab = "overview" | "orders" | "inventory";

const statusLabels: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

function AdminPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  // Queries
  const fetchOrders = useServerFn(listMyOrders);
  const fetchProducts = useServerFn(listProducts);
  const fetchCategories = useServerFn(listCategories);

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => fetchOrders(),
    enabled: !!user,
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["products", {}],
    queryFn: () => fetchProducts({ data: {} }),
    enabled: !!user,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => fetchCategories(),
    enabled: !!user,
  });

  // Server functions
  const updateStatus = useServerFn(adminUpdateOrderStatus);
  const editProduct = useServerFn(adminUpdateProduct);
  const removeProduct = useServerFn(adminRemoveProduct);
  const addProduct = useServerFn(adminAddProduct);

  // Component State
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Inline editing product ID
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    sku: "",
    price: 0,
    stock: 0,
    brand: "Sheetal",
    is_featured: false,
    image_url: "",
  });

  // Add Product Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    slug: "",
    short_description: "",
    description: "",
    sku: "",
    price: 0,
    stock: 0,
    category_id: "",
    brand: "Sheetal",
    is_featured: false,
    image_url: "",
  });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  // Analytics Calculations
  const analytics = useMemo(() => {
    if (!orders || !products) return { revenue: 0, ordersCount: 0, lowStock: 0, avgValue: 0 };

    const completedRevenue = orders
      .filter((o: any) => ["paid", "shipped", "delivered"].includes(o.status))
      .reduce((sum: number, o: any) => sum + Number(o.total), 0);

    const lowStockCount = products.filter((p: any) => p.stock < 10).length;

    const avgVal = orders.length > 0 ? completedRevenue / orders.length : 0;

    return {
      revenue: completedRevenue,
      ordersCount: orders.length,
      lowStock: lowStockCount,
      avgValue: avgVal,
    };
  }, [orders, products]);

  // Edit product handler
  const handleEditClick = (p: any) => {
    setEditingProductId(p.id);
    setEditForm({
      name: p.name,
      sku: p.sku ?? `SH-${p.id}`,
      price: Number(p.price),
      stock: p.stock,
      brand: p.brand ?? "Sheetal",
      is_featured: !!p.is_featured,
      image_url: Array.isArray(p.images) && typeof p.images[0] === "string" ? p.images[0] : "",
    });
  };

  const handleEditSave = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    try {
      await editProduct({ data: { id, ...editForm } });
      toast.success("Product updated successfully");
      setEditingProductId(null);
      qc.invalidateQueries({ queryKey: ["products"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to update product");
    }
  };

  const handleRemoveProduct = async (id: string, name: string) => {
    const ok = window.confirm(`Remove "${name}" from the catalog?`);
    if (!ok) return;

    try {
      await removeProduct({ data: { id } });
      toast.success("Product removed from catalog");
      if (editingProductId === id) setEditingProductId(null);
      qc.invalidateQueries({ queryKey: ["products"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to remove product");
    }
  };

  // Add Product Submit
  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.category_id) {
      toast.error("Please select a category");
      return;
    }
    try {
      // Auto-generate slug from name if empty
      const slug =
        newProduct.slug.trim() || newProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      await addProduct({
        data: {
          ...newProduct,
          slug,
          image_url: newProduct.image_url || undefined,
        },
      });
      toast.success("Product added to master catalog");
      setShowAddForm(false);
      setNewProduct({
        name: "",
        slug: "",
        short_description: "",
        description: "",
        sku: "",
        price: 0,
        stock: 0,
        category_id: "",
        brand: "Sheetal",
        is_featured: false,
        image_url: "",
      });
      qc.invalidateQueries({ queryKey: ["products"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to add product");
    }
  };

  // Status Change Handler
  const handleStatusChange = async (orderId: string, nextStatus: string) => {
    try {
      await updateStatus({ data: { id: orderId, status: nextStatus } });
      toast.success(`Order status updated to ${statusLabels[nextStatus] ?? nextStatus}`);
      qc.invalidateQueries({ queryKey: ["orders"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  if (ordersLoading || productsLoading) {
    return (
      <div className="min-h-screen flex flex-col justify-between">
        <Header />
        <div className="flex flex-1 items-center justify-center py-32">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-ink" />
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Loading admin dashboard...
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-muted/5">
      <Header />
      <div className="mx-auto max-w-7xl w-full px-6 py-12 flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Console</div>
            <h1 className="font-display text-5xl mt-1">Admin Dashboard</h1>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 text-xs uppercase tracking-widest border transition-all ${
                activeTab === "overview"
                  ? "bg-ink text-primary-foreground border-ink"
                  : "border-border hover:border-ink"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-4 py-2 text-xs uppercase tracking-widest border transition-all ${
                activeTab === "orders"
                  ? "bg-ink text-primary-foreground border-ink"
                  : "border-border hover:border-ink"
              }`}
            >
              Orders ({orders?.length ?? 0})
            </button>
            <button
              onClick={() => setActiveTab("inventory")}
              className={`px-4 py-2 text-xs uppercase tracking-widest border transition-all ${
                activeTab === "inventory"
                  ? "bg-ink text-primary-foreground border-ink"
                  : "border-border hover:border-ink"
              }`}
            >
              Inventory ({products?.length ?? 0})
            </button>
          </div>
        </div>

        {/* Tab 1: Overview Panel */}
        {activeTab === "overview" && (
          <div className="mt-10 space-y-10">
            {/* Metric widgets */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="border border-border bg-background p-6 space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <span className="text-xs uppercase tracking-widest font-medium">Revenue</span>
                  <DollarSign className="h-4 w-4" />
                </div>
                <div className="font-display text-3xl font-semibold">
                  {formatPrice(analytics.revenue)}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  From paid, shipped, and delivered orders
                </p>
              </div>

              <div className="border border-border bg-background p-6 space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <span className="text-xs uppercase tracking-widest font-medium">Orders</span>
                  <FileText className="h-4 w-4" />
                </div>
                <div className="font-display text-3xl font-semibold">{analytics.ordersCount}</div>
                <p className="text-[10px] text-muted-foreground">Total order transaction volume</p>
              </div>

              <div className="border border-border bg-background p-6 space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <span className="text-xs uppercase tracking-widest font-medium">
                    Avg Order Value
                  </span>
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div className="font-display text-3xl font-semibold">
                  {formatPrice(analytics.avgValue)}
                </div>
                <p className="text-[10px] text-muted-foreground">Average transaction ticket size</p>
              </div>

              <div className="border border-border bg-background p-6 space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <span className="text-xs uppercase tracking-widest font-medium">
                    Low Stock Alerts
                  </span>
                  <AlertTriangle
                    className={`h-4 w-4 ${analytics.lowStock > 0 ? "text-amber-600" : ""}`}
                  />
                </div>
                <div
                  className={`font-display text-3xl font-semibold ${analytics.lowStock > 0 ? "text-amber-600" : ""}`}
                >
                  {analytics.lowStock}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Products with stock under 10 pieces
                </p>
              </div>
            </div>

            {/* Quick Summary Panels */}
            <div className="grid gap-8 md:grid-cols-2">
              <div className="border border-border bg-background p-6">
                <h3 className="font-display text-xl mb-4">Recent Transactions</h3>
                <div className="divide-y divide-border text-sm">
                  {orders?.slice(0, 5).map((o: any) => (
                    <div key={o.id} className="py-3 flex justify-between items-center">
                      <div>
                        <div className="font-mono font-medium">{o.order_number}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDateIST(o.created_at)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs uppercase font-medium">{o.status}</span>
                        <span className="font-medium font-mono">{formatPrice(o.total)}</span>
                      </div>
                    </div>
                  ))}
                  {(!orders || orders.length === 0) && (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      No recent transactions logs.
                    </div>
                  )}
                </div>
              </div>

              <div className="border border-border bg-background p-6">
                <h3 className="font-display text-xl mb-4">Low Stock Warning items</h3>
                <div className="divide-y divide-border text-sm">
                  {products
                    ?.filter((p: any) => p.stock < 10)
                    .slice(0, 5)
                    .map((p: any) => (
                      <div key={p.id} className="py-3 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-muted overflow-hidden">
                            {p.images?.[0] && (
                              <img
                                src={p.images[0]}
                                alt={p.name}
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold">{p.name}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">
                              {p.sku}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold text-amber-600 uppercase">
                            {p.stock} left
                          </span>
                          <div className="text-[10px] text-muted-foreground">
                            {formatPrice(p.price)}
                          </div>
                        </div>
                      </div>
                    ))}
                  {products?.filter((p: any) => p.stock < 10).length === 0 && (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      All inventory products healthy!
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Orders Panel */}
        {activeTab === "orders" && (
          <div className="mt-10">
            <div className="border border-border bg-background overflow-hidden">
              <div className="p-4 border-b border-border font-display text-xl bg-muted/10">
                Orders Registry
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/20 text-xs uppercase tracking-widest text-muted-foreground">
                      <th className="p-4">Order Ref</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Total</th>
                      <th className="p-4">Method</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {orders?.map((o: any) => {
                      const isExpanded = expandedOrderId === o.id;
                      const addr = o.shipping_address as any;
                      return (
                        <>
                          <tr key={o.id} className="hover:bg-muted/10 transition-colors">
                            <td className="p-4 font-mono font-medium">{o.order_number}</td>
                            <td className="p-4 text-xs text-muted-foreground">
                              {formatDateTimeIST(o.created_at)}
                            </td>
                            <td className="p-4 font-medium">{addr?.full_name || "N/A"}</td>
                            <td className="p-4 font-mono font-medium">{formatPrice(o.total)}</td>
                            <td className="p-4 text-xs uppercase font-semibold text-muted-foreground">
                              {o.payment_type === "cod" ? "COD" : "Online"}
                            </td>
                            <td className="p-4">
                              <select
                                value={o.status}
                                onChange={(e) => handleStatusChange(o.id, e.target.value)}
                                className={`text-xs border outline-none px-2 py-1 uppercase font-semibold ${
                                  o.status === "paid"
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : o.status === "shipped"
                                      ? "bg-blue-50 text-blue-700 border-blue-200"
                                      : o.status === "delivered"
                                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                        : o.status === "cancelled"
                                          ? "bg-red-50 text-red-700 border-red-200"
                                          : "bg-amber-50 text-amber-700 border-amber-200"
                                }`}
                              >
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="refunded">Refunded</option>
                              </select>
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => setExpandedOrderId(isExpanded ? null : o.id)}
                                className="text-xs uppercase tracking-widest text-muted-foreground hover:text-ink inline-flex items-center gap-1 border border-border px-2.5 py-1.5 hover:border-ink transition-all"
                              >
                                <span>Details</span>
                                {isExpanded ? (
                                  <ChevronUp className="h-3 w-3" />
                                ) : (
                                  <ChevronDown className="h-3 w-3" />
                                )}
                              </button>
                            </td>
                          </tr>

                          {/* Expanded Rows details */}
                          {isExpanded && (
                            <tr className="bg-muted/10">
                              <td colSpan={7} className="p-6">
                                <div className="grid gap-6 md:grid-cols-2 text-xs">
                                  <div className="space-y-2">
                                    <div className="uppercase tracking-widest text-muted-foreground font-semibold text-[10px]">
                                      Shipping Information
                                    </div>
                                    {addr ? (
                                      <div className="space-y-1 text-muted-foreground">
                                        <div className="font-semibold text-ink">
                                          {addr.full_name}
                                        </div>
                                        <div>
                                          {addr.line1}
                                          {addr.line2 ? `, ${addr.line2}` : ""}
                                        </div>
                                        <div>
                                          {addr.city}, {addr.state} {addr.postal_code}
                                        </div>
                                        <div>{addr.country}</div>
                                        {addr.phone && (
                                          <div className="pt-1 font-mono">{addr.phone}</div>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground italic">
                                        No shipping details provided.
                                      </span>
                                    )}
                                  </div>

                                  <div className="space-y-2">
                                    <div className="uppercase tracking-widest text-muted-foreground font-semibold text-[10px]">
                                      Billing Summary
                                    </div>
                                    <div className="space-y-1.5 text-muted-foreground">
                                      <div className="flex justify-between">
                                        <span>Subtotal:</span>
                                        <span className="font-mono">{formatPrice(o.subtotal)}</span>
                                      </div>
                                      {o.discount > 0 && (
                                        <div className="flex justify-between">
                                          <span>Discount:</span>
                                          <span className="font-mono">
                                            -{formatPrice(o.discount)}
                                          </span>
                                        </div>
                                      )}
                                      <div className="flex justify-between">
                                        <span>Shipping:</span>
                                        <span className="font-mono">{formatPrice(o.shipping)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Tax:</span>
                                        <span className="font-mono">{formatPrice(o.tax)}</span>
                                      </div>
                                      <div className="border-t border-border/60 pt-1.5 flex justify-between font-semibold text-ink">
                                        <span>Total:</span>
                                        <span className="font-mono">{formatPrice(o.total)}</span>
                                      </div>
                                    </div>
                                    {o.payment_reference && (
                                      <div className="pt-2 font-mono text-[9px] text-muted-foreground flex justify-between">
                                        <span>Gateway Ref ID:</span>
                                        <span>{o.payment_reference}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                    {(!orders || orders.length === 0) && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          No orders in register yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Inventory Panel */}
        {activeTab === "inventory" && (
          <div className="mt-10 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="font-display text-2xl">Inventory Catalog</h2>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-ink px-4 py-2.5 text-xs uppercase tracking-widest text-primary-foreground flex items-center gap-1.5 font-medium hover:opacity-90 transition-opacity"
              >
                <Plus className="h-4 w-4" />
                <span>Add Product</span>
              </button>
            </div>

            {/* Inline editing overlay/dialog for Add Product */}
            {showAddForm && (
              <div className="border border-ink bg-background p-6 max-w-2xl space-y-6">
                <div className="flex justify-between items-center border-b border-border pb-3">
                  <h3 className="font-display text-xl">New Master Catalog Product</h3>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="text-muted-foreground hover:text-ink"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleAddProductSubmit} className="grid gap-4 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
                      Product Name
                    </span>
                    <input
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      placeholder="e.g. Stoneware Vase"
                      className="w-full border border-border bg-background px-4 py-2 text-sm outline-none focus:border-ink"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
                      SKU
                    </span>
                    <input
                      value={newProduct.sku}
                      onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                      placeholder="e.g. SH-09"
                      className="w-full border border-border bg-background px-4 py-2 text-sm font-mono outline-none focus:border-ink"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
                      Slug (Optional)
                    </span>
                    <input
                      value={newProduct.slug}
                      onChange={(e) => setNewProduct({ ...newProduct, slug: e.target.value })}
                      placeholder="e.g. stoneware-vase"
                      className="w-full border border-border bg-background px-4 py-2 text-sm outline-none focus:border-ink"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
                      Category
                    </span>
                    <select
                      value={newProduct.category_id}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, category_id: e.target.value })
                      }
                      className="w-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-ink"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories?.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
                      Brand
                    </span>
                    <input
                      value={newProduct.brand}
                      onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                      className="w-full border border-border bg-background px-4 py-2 text-sm outline-none focus:border-ink"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
                      Unit Price
                    </span>
                    <input
                      type="number"
                      min="1"
                      value={newProduct.price || ""}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full border border-border bg-background px-4 py-2 text-sm outline-none focus:border-ink"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
                      Stock Count
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={newProduct.stock ?? ""}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, stock: parseInt(e.target.value, 10) ?? 0 })
                      }
                      className="w-full border border-border bg-background px-4 py-2 text-sm outline-none focus:border-ink"
                      required
                    />
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
                      Image URL (Optional)
                    </span>
                    <input
                      value={newProduct.image_url}
                      onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
                      placeholder="e.g. https://images.unsplash.com/..."
                      className="w-full border border-border bg-background px-4 py-2 text-sm outline-none focus:border-ink"
                    />
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
                      Short Description
                    </span>
                    <input
                      value={newProduct.short_description}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, short_description: e.target.value })
                      }
                      className="w-full border border-border bg-background px-4 py-2 text-sm outline-none focus:border-ink"
                      required
                    />
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
                      Full Description
                    </span>
                    <textarea
                      value={newProduct.description}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, description: e.target.value })
                      }
                      rows={3}
                      className="w-full border border-border bg-background p-4 text-sm outline-none focus:border-ink resize-none"
                      required
                    />
                  </label>

                  <label className="flex items-center gap-2 text-sm sm:col-span-2 py-2">
                    <input
                      type="checkbox"
                      checked={newProduct.is_featured}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, is_featured: e.target.checked })
                      }
                      className="h-4 w-4 accent-ink"
                    />
                    Mark as Featured Product
                  </label>

                  <div className="flex gap-3 sm:col-span-2 border-t border-border pt-4">
                    <button
                      type="submit"
                      className="bg-ink px-6 py-3 text-xs uppercase tracking-widest text-primary-foreground font-semibold"
                    >
                      Save Product
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="border border-border px-6 py-3 text-xs uppercase tracking-widest text-muted-foreground hover:border-ink transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Inventory Listing */}
            <div className="border border-border bg-background overflow-hidden">
              <div className="p-4 border-b border-border font-display text-xl bg-muted/10 font-semibold">
                Product Catalog
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/20 text-xs uppercase tracking-widest text-muted-foreground">
                      <th className="p-4">Product Info</th>
                      <th className="p-4">SKU</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Stock</th>
                      <th className="p-4">Brand</th>
                      <th className="p-4">Featured</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {products?.map((p: any) => {
                      const isEditing = editingProductId === p.id;
                      return (
                        <tr key={p.id} className="hover:bg-muted/10 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-9 bg-muted overflow-hidden">
                                {(isEditing ? editForm.image_url : p.images?.[0]) && (
                                  <img
                                    src={isEditing ? editForm.image_url : p.images[0]}
                                    alt={p.name}
                                    className="h-full w-full object-cover"
                                  />
                                )}
                              </div>
                              <div>
                                {isEditing ? (
                                  <input
                                    value={editForm.name}
                                    onChange={(e) =>
                                      setEditForm({ ...editForm, name: e.target.value })
                                    }
                                    className="border border-border px-2 py-1 text-sm bg-background w-48 font-medium"
                                  />
                                ) : (
                                  <div className="font-semibold">{p.name}</div>
                                )}
                                <div className="text-[10px] text-muted-foreground uppercase">
                                  {p.slug}
                                </div>
                                {isEditing && (
                                  <input
                                    value={editForm.image_url}
                                    onChange={(e) =>
                                      setEditForm({ ...editForm, image_url: e.target.value })
                                    }
                                    placeholder="Image URL"
                                    className="mt-2 w-64 border border-border bg-background px-2 py-1 text-xs outline-none focus:border-ink"
                                  />
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-mono">
                            {isEditing ? (
                              <input
                                value={editForm.sku}
                                onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                                className="border border-border px-2 py-1 text-sm bg-background font-mono w-24"
                              />
                            ) : (
                              (p.sku ?? `SH-${p.id}`)
                            )}
                          </td>
                          <td className="p-4 font-mono">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editForm.price || ""}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    price: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="border border-border px-2 py-1 text-sm bg-background font-mono w-20"
                              />
                            ) : (
                              formatPrice(p.price)
                            )}
                          </td>
                          <td className="p-4">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editForm.stock ?? ""}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    stock: parseInt(e.target.value, 10) ?? 0,
                                  })
                                }
                                className="border border-border px-2 py-1 text-sm bg-background font-mono w-16"
                              />
                            ) : (
                              <span
                                className={`font-mono font-medium ${p.stock < 10 ? "text-amber-600 font-bold" : ""}`}
                              >
                                {p.stock} {p.stock < 10 && " (low)"}
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            {isEditing ? (
                              <input
                                value={editForm.brand}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, brand: e.target.value })
                                }
                                className="border border-border px-2 py-1 text-sm bg-background w-20"
                              />
                            ) : (
                              p.brand || "Sheetal"
                            )}
                          </td>
                          <td className="p-4">
                            {isEditing ? (
                              <input
                                type="checkbox"
                                checked={editForm.is_featured}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, is_featured: e.target.checked })
                                }
                                className="h-4 w-4 accent-ink"
                              />
                            ) : p.is_featured ? (
                              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5">
                                YES
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">No</span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            {isEditing ? (
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={(e) => handleEditSave(e, p.id)}
                                  className="border border-ink bg-ink text-primary-foreground p-1.5 rounded transition-opacity hover:opacity-90"
                                  title="Save"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingProductId(null)}
                                  className="border border-border p-1.5 rounded hover:border-ink transition-all"
                                  title="Cancel"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleEditClick(p)}
                                  className="text-xs uppercase tracking-widest text-muted-foreground hover:text-ink inline-flex items-center gap-1 border border-border px-2.5 py-1.5 hover:border-ink transition-all"
                                >
                                  <Edit2 className="h-3 w-3" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => handleRemoveProduct(p.id, p.name)}
                                  className="text-xs uppercase tracking-widest text-red-700 hover:text-red-800 inline-flex items-center gap-1 border border-red-200 px-2.5 py-1.5 hover:border-red-500 transition-all"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  <span>Remove</span>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
