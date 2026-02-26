import { useEffect, useState } from "react";

interface MarketInfo {
  name: string;
  emoji: string;
  timezone: string;
  openHour: number;
  openMinute: number;
  closeHour: number;
  closeMinute: number;
  is24h: boolean;
  hoursLabel: string;
  accentFrom: string;
  accentTo: string;
  glowColor: string;
}

const MARKETS: MarketInfo[] = [
  {
    name: "New York",
    emoji: "🇺🇸",
    timezone: "America/New_York",
    openHour: 9,
    openMinute: 30,
    closeHour: 16,
    closeMinute: 0,
    is24h: false,
    hoursLabel: "9h30 – 16h00",
    accentFrom: "from-blue-500",
    accentTo: "to-indigo-600",
    glowColor: "rgba(99,102,241,0.4)",
  },
  {
    name: "London",
    emoji: "🇬🇧",
    timezone: "Europe/London",
    openHour: 8,
    openMinute: 0,
    closeHour: 16,
    closeMinute: 30,
    is24h: false,
    hoursLabel: "~3h00 – 11h30 (EST)",
    accentFrom: "from-cyan-500",
    accentTo: "to-teal-600",
    glowColor: "rgba(6,182,212,0.4)",
  },
  {
    name: "Tokyo",
    emoji: "🇯🇵",
    timezone: "Asia/Tokyo",
    openHour: 9,
    openMinute: 0,
    closeHour: 15,
    closeMinute: 0,
    is24h: false,
    hoursLabel: "~20h00 – 2h00 (EST)",
    accentFrom: "from-rose-500",
    accentTo: "to-pink-600",
    glowColor: "rgba(244,63,94,0.4)",
  },
  {
    name: "Forex",
    emoji: "🌍",
    timezone: "America/New_York",
    openHour: 0,
    openMinute: 0,
    closeHour: 0,
    closeMinute: 0,
    is24h: true,
    hoursLabel: "24h / 24 — 5j / 7",
    accentFrom: "from-amber-500",
    accentTo: "to-orange-600",
    glowColor: "rgba(245,158,11,0.4)",
  },
];

function getTimeInTimezone(tz: string): Date {
  const str = new Date().toLocaleString("en-US", { timeZone: tz });
  return new Date(str);
}

function isMarketOpen(market: MarketInfo): boolean {
  if (market.is24h) {
    // Forex: open Mon-Fri, closed Sat-Sun
    const nyTime = getTimeInTimezone("America/New_York");
    const day = nyTime.getDay();
    // Closed from Friday 17:00 ET to Sunday 17:00 ET
    if (day === 6) return false; // Saturday
    if (day === 0) {
      // Sunday: open after 17:00 ET
      return nyTime.getHours() >= 17;
    }
    if (day === 5) {
      // Friday: close at 17:00 ET
      return nyTime.getHours() < 17;
    }
    return true;
  }

  const localTime = getTimeInTimezone(market.timezone);
  const day = localTime.getDay();
  if (day === 0 || day === 6) return false; // Weekend

  const currentMinutes = localTime.getHours() * 60 + localTime.getMinutes();
  const openMinutes = market.openHour * 60 + market.openMinute;
  const closeMinutes = market.closeHour * 60 + market.closeMinute;

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

function AnalogClock({
  timezone,
  isOpen,
  glowColor,
  accentFrom,
  accentTo,
}: {
  timezone: string;
  isOpen: boolean;
  glowColor: string;
  accentFrom: string;
  accentTo: string;
}) {
  const [time, setTime] = useState(getTimeInTimezone(timezone));

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeInTimezone(timezone));
    }, 1000);
    return () => clearInterval(interval);
  }, [timezone]);

  const hours = time.getHours() % 12;
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  const hourAngle = (hours + minutes / 60) * 30;
  const minuteAngle = (minutes + seconds / 60) * 6;
  const secondAngle = seconds * 6;

  const cx = 50;
  const cy = 50;

  const hourHandLength = 22;
  const minuteHandLength = 30;
  const secondHandLength = 34;

  const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;

  const hourX = cx + hourHandLength * Math.cos(toRad(hourAngle));
  const hourY = cy + hourHandLength * Math.sin(toRad(hourAngle));
  const minX = cx + minuteHandLength * Math.cos(toRad(minuteAngle));
  const minY = cy + minuteHandLength * Math.sin(toRad(minuteAngle));
  const secX = cx + secondHandLength * Math.cos(toRad(secondAngle));
  const secY = cy + secondHandLength * Math.sin(toRad(secondAngle));

  // Determine gradient ID based on accent colors
  const gradId = `grad-${accentFrom}-${accentTo}`.replace(/[^a-zA-Z0-9-]/g, "");

  return (
    <div className="relative">
      {isOpen && (
        <div
          className="absolute inset-0 rounded-full blur-xl opacity-30 animate-pulse"
          style={{ background: glowColor }}
        />
      )}
      <svg viewBox="0 0 100 100" className="w-24 h-24 md:w-28 md:h-28 relative z-10">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={accentFrom.includes("blue") ? "#3B82F6" : accentFrom.includes("cyan") ? "#06B6D4" : accentFrom.includes("rose") ? "#F43F5E" : "#F59E0B"} />
            <stop offset="100%" stopColor={accentTo.includes("indigo") ? "#4F46E5" : accentTo.includes("teal") ? "#0D9488" : accentTo.includes("pink") ? "#EC4899" : "#EA580C"} />
          </linearGradient>
        </defs>

        {/* Outer ring */}
        <circle cx={cx} cy={cy} r="46" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
        <circle cx={cx} cy={cy} r="46" fill="none" stroke={`url(#${gradId})`} strokeWidth="1.5" opacity={isOpen ? "0.6" : "0.15"} />

        {/* Clock face */}
        <circle cx={cx} cy={cy} r="43" fill="rgba(17,24,39,0.8)" />

        {/* Hour markers */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180);
          const isMajor = i % 3 === 0;
          const innerR = isMajor ? 36 : 38;
          const outerR = 41;
          return (
            <line
              key={i}
              x1={cx + innerR * Math.cos(angle)}
              y1={cy + innerR * Math.sin(angle)}
              x2={cx + outerR * Math.cos(angle)}
              y2={cy + outerR * Math.sin(angle)}
              stroke={isMajor ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)"}
              strokeWidth={isMajor ? "1.5" : "0.8"}
              strokeLinecap="round"
            />
          );
        })}

        {/* Hour hand */}
        <line
          x1={cx}
          y1={cy}
          x2={hourX}
          y2={hourY}
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="transition-all duration-500"
        />

        {/* Minute hand */}
        <line
          x1={cx}
          y1={cy}
          x2={minX}
          y2={minY}
          stroke="rgba(255,255,255,0.7)"
          strokeWidth="1.8"
          strokeLinecap="round"
          className="transition-all duration-300"
        />

        {/* Second hand */}
        <line
          x1={cx}
          y1={cy}
          x2={secX}
          y2={secY}
          stroke={isOpen ? "#10B981" : "#EF4444"}
          strokeWidth="0.8"
          strokeLinecap="round"
        />

        {/* Center dot */}
        <circle cx={cx} cy={cy} r="2.5" fill="white" />
        <circle cx={cx} cy={cy} r="1.2" fill={isOpen ? "#10B981" : "#EF4444"} />
      </svg>
    </div>
  );
}

export default function MarketHours() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🕐</span>
        <h2 className="text-sm md:text-base font-bold">Heures d&apos;Ouverture des Marchés</h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {MARKETS.map((market) => {
          const open = isMarketOpen(market);
          const localTime = getTimeInTimezone(market.timezone);
          const timeStr = localTime.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });

          return (
            <div
              key={market.name}
              className={`relative bg-[#111827] border rounded-2xl p-4 md:p-5 transition-all duration-500 overflow-hidden ${
                open
                  ? "border-white/[0.12] hover:border-white/[0.2]"
                  : "border-white/[0.06] hover:border-white/[0.1]"
              }`}
            >
              {/* Subtle gradient background for open markets */}
              {open && (
                <div
                  className="absolute inset-0 opacity-[0.04] rounded-2xl"
                  style={{
                    background: `radial-gradient(ellipse at center, ${market.glowColor}, transparent 70%)`,
                  }}
                />
              )}

              <div className="relative z-10 flex flex-col items-center text-center">
                {/* Market name + emoji */}
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="text-lg md:text-xl">{market.emoji}</span>
                  <span className="text-xs md:text-sm font-bold">{market.name}</span>
                </div>

                {/* Analog Clock */}
                <AnalogClock
                  timezone={market.timezone}
                  isOpen={open}
                  glowColor={market.glowColor}
                  accentFrom={market.accentFrom}
                  accentTo={market.accentTo}
                />

                {/* Digital time */}
                <p className="text-sm md:text-base font-mono font-bold mt-2 tracking-wider">
                  {timeStr}
                </p>

                {/* Status badge */}
                <div className="mt-2">
                  {market.is24h ? (
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] md:text-xs font-bold ${
                        open
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${open ? "bg-amber-400 animate-pulse" : "bg-gray-500"}`} />
                      {open ? "24/7 OUVERT" : "FERMÉ (Weekend)"}
                    </span>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] md:text-xs font-bold ${
                        open
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-red-500/15 text-red-400 border border-red-500/20"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          open ? "bg-emerald-400 animate-pulse" : "bg-red-400"
                        }`}
                      />
                      {open ? "OUVERT" : "FERMÉ"}
                    </span>
                  )}
                </div>

                {/* Hours label */}
                <p className="text-[10px] md:text-xs text-gray-500 mt-1.5">{market.hoursLabel}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}