// Auto-seed initial leaderboard with demo entries (runs ONCE on server boot if file empty).
// Provides social proof on the public leaderboard.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GAMI_FILE = path.join(__dirname, 'data', 'gamification.json');

export function seed() {
  if (fs.existsSync(GAMI_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(GAMI_FILE, 'utf8'));
      if (Object.keys(data.users || {}).length > 0) {
        console.log('[GamiSeed] Leaderboard already has data, skipping seed.');
        return;
      }
    } catch {}
  }

  const seedUsers = [
    { key: 'alpha@cryptoia.demo', name: 'AlphaWhale',     xp: 4250, badges: 11 },
    { key: 'sigma@cryptoia.demo', name: 'SigmaTrader',    xp: 3120, badges: 9  },
    { key: 'satoshi@cryptoia.demo', name: 'SatoshiFan',   xp: 2880, badges: 8  },
    { key: 'eth@cryptoia.demo',   name: 'ETHmaxi',        xp: 2350, badges: 7  },
    { key: 'jb@cryptoia.demo',    name: 'JBLegend',       xp: 1980, badges: 7  },
    { key: 'mary@cryptoia.demo',  name: 'MaryC',          xp: 1620, badges: 6  },
    { key: 'leo@cryptoia.demo',   name: 'LeoP',           xp: 1410, badges: 5  },
    { key: 'kai@cryptoia.demo',   name: 'KaiM',           xp: 1280, badges: 5  },
    { key: 'sol@cryptoia.demo',   name: 'SolHunter',      xp: 1050, badges: 4  },
    { key: 'bnb@cryptoia.demo',   name: 'BNBking',        xp: 920,  badges: 4  },
    { key: 'doge@cryptoia.demo',  name: 'DogeFan',        xp: 780,  badges: 3  },
    { key: 'ada@cryptoia.demo',   name: 'ADAmoon',        xp: 640,  badges: 3  },
    { key: 'avax@cryptoia.demo',  name: 'AvaxBoss',       xp: 510,  badges: 3  },
    { key: 'matic@cryptoia.demo', name: 'MaticMaster',    xp: 390,  badges: 2  },
    { key: 'arb@cryptoia.demo',   name: 'ArbTrader',      xp: 280,  badges: 2  },
  ];

  const out = { users: {} };
  const fakeBadges = (n) => Array.from({ length: n }, (_, i) => ({
    id: `seed-${i}`,
    unlockedAt: new Date(Date.now() - (n - i) * 86400000).toISOString(),
  }));

  for (const u of seedUsers) {
    out.users[u.key] = {
      xp: u.xp,
      badges: fakeBadges(u.badges),
      displayName: u.name,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      lastActivity: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
    };
  }

  try {
    fs.mkdirSync(path.dirname(GAMI_FILE), { recursive: true });
    fs.writeFileSync(GAMI_FILE, JSON.stringify(out, null, 2));
    console.log(`[GamiSeed] Seeded ${seedUsers.length} demo users in leaderboard.`);
  } catch (e) {
    console.error('[GamiSeed] write error:', e?.message);
  }
}
