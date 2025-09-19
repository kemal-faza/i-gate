export function formatCurrency(amount: number, currency: "USD" | "IDR") {
  try {
    if (currency === "IDR") {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(amount);
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

export function formatDateTime(iso: string) {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  } catch {
    return iso;
  }
}

export function shortId(id: string, prefixLen = 1, tail = 4) {
  if (!id) return "";
  if (id.length <= prefixLen + tail) return id;
  return `${id.slice(0, prefixLen)}…${id.slice(-tail)}`;
}

export function shortUuid(uuid: string) {
  if (!uuid) return "";
  const parts = uuid.split("-");
  if (parts.length < 2) return shortId(uuid, 4, 4);
  return `${parts[0]}…${parts[parts.length - 1]}`;
}
