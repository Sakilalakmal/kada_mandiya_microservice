export type VendorMetricsRange = "7d" | "30d";

export type VendorOrderSeriesPoint = {
  date: string;
  orders: number;
};

export type VendorOrderStatusBreakdownItem = {
  status: string;
  count: number;
};

