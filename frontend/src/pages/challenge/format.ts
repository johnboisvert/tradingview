// Number formatting helpers used across the Challenge UI. All are NaN-safe so
// legacy data (delisted coins, missing mark prices) never bubbles up as 'NaN'
// in the rendered table.

export function fmtUsd(n: number): string {
  if (!Number.isFinite(n)) return "0.00";
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtPrice(n: number): string {
  if (!Number.isFinite(n)) return "0.00";
  if (n >= 1) return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 0.01) return n.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  if (n >= 0.0001) return n.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 6 });
  // Sub-fraction (SHIB, PEPE, HTX…) — keep 4 significant digits so $0.00000238 stays distinguishable
  // from $0.000002. Without this, fmtPrice rounds to "0.000002" and breaks SL/TP validation.
  if (n > 0) {
    return n.toLocaleString("en-US", {
      minimumSignificantDigits: 4,
      maximumSignificantDigits: 4,
      useGrouping: false,
    });
  }
  return "0.0000";
}

export function fmtQty(n: number): string {
  if (!Number.isFinite(n)) return "0";
  if (n >= 1) return n.toFixed(4);
  if (n >= 0.0001) return n.toFixed(6);
  return n.toFixed(8);
}

export function fmtMcap(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${fmtUsd(n)}`;
}
