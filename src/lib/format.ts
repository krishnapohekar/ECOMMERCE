export const formatPrice = (n: number | string, currency = "INR") =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(
    typeof n === "string" ? parseFloat(n) : n,
  );

const IST_TIME_ZONE = "Asia/Kolkata";

export const formatDateIST = (value: string | number | Date) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeZone: IST_TIME_ZONE,
  }).format(new Date(value));

export const formatDateTimeIST = (value: string | number | Date) =>
  `${new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "medium",
    hour12: true,
    timeZone: IST_TIME_ZONE,
  }).format(new Date(value))} IST`;
