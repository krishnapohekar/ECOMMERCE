export const formatPrice = (n: number | string, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    typeof n === "string" ? parseFloat(n) : n,
  );
