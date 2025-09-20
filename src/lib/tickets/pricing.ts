export type TierKey = "regular" | "vip" | "vvip";

export type TierPricing = {
  label: string;
  price: number;
};

export const TIER_PRICING: Record<TierKey, TierPricing> = {
  regular: { label: "Regular", price: 100_000 },
  vip: { label: "VIP", price: 250_000 },
  vvip: { label: "VVIP", price: 500_000 },
};
