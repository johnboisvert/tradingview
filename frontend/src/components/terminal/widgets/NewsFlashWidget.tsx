// News flash widget — Bloomberg-style monospace scrolling headlines.
// Consumes existing /api/news-crypto endpoint (RSS scraper).
import { useEffect, useState } from "react";

interface Item {
  title: string;
  source: string;
  link: string;
  published_at?: string;
  category?: string;
}

interface Props {
  filter?: string;   // Filter by symbol (BTC, ETH, …)
  limit?: number;
  refreshMs?: number;
}

export default function NewsFlashWidget({ filter, limit = 40, refreshMs = 60000 }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function pull() {
      try {
        const r = await fetch("/api/news-crypto");
        const j = await r.json();
        if (!alive) return;
        const raw: Item[] = j.articles || j.news || j.items || j || [];
        setItems(Array.isArray(raw) ? raw : []);
        setLoading(false);
      } catch {
        setLoading(false);
      }
    }
    pull();
    const id = setInterval(pull, refreshMs);
    return () => { alive = false; clearInterval(id); };
  }, [refreshMs]);

  const filtered = (filter ? items.filter(i => (i.title || "").toUpperCase().includes(filter.toUpperCase())) : items).slice(0, limit);

  const relative = (iso?: string) => {
    if (!iso) return "";
    try {
      const t = new Date(iso).getTime();
      const diff = Date.now() - t;
      const m = Math.floor(diff / 60000);
      if (m < 1) return "now";
      if (m < 60) return `${m}m`;
      const h = Math.floor(m / 60);
      if (h < 24) return `${h}h`;
      return `${Math.floor(h / 24)}d`;
    } catch { return ""; }
  };

  return (
    <div className="font-mono text-[10.5px]">
      {loading && <div className="text-white/40">Loading news…</div>}
      {!loading && filtered.length === 0 && <div className="text-white/30 py-3 text-center">— no headlines —</div>}
      <ul className="space-y-0.5">
        {filtered.map((it, i) => (
          <li key={i} className="border-l-2 border-amber-500/40 pl-2 py-0.5 hover:border-amber-500 transition-colors">
            <a
              href={it.link || "#"}
              target="_blank"
              rel="noreferrer noopener"
              data-testid={`news-item-${i}`}
              className="block group"
            >
              <div className="flex items-center gap-1.5 text-[9px] text-white/40 uppercase tracking-wider">
                <span className="text-amber-400 font-bold">{it.source?.slice(0, 8) || "CRYPTO"}</span>
                <span className="text-white/20">·</span>
                <span>{relative(it.published_at)}</span>
              </div>
              <div className="text-white/90 group-hover:text-amber-300 transition-colors leading-tight">
                {it.title}
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
