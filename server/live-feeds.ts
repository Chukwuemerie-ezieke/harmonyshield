/**
 * Live Feed Integrations for HarmonyShield
 * 
 * 1. AlienVault OTX — Real threat intelligence (public API, no key needed for browsing)
 * 2. AbuseIPDB — Real IP reputation checks (free API key: 1,000 checks/day)
 * 3. Cybersecurity News — Real RSS feeds from The Hacker News, BleepingComputer, Krebs on Security
 */

import Parser from "rss-parser";

const rssParser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "HarmonyShield/1.0 (EdTech Cybersecurity Platform)",
  },
});

// Cache to avoid hammering APIs on every request
interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
}

const cache: Record<string, CacheEntry<any>> = {};
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

function getCached<T>(key: string): T | null {
  const entry = cache[key];
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
    delete cache[key];
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache[key] = { data, fetchedAt: Date.now() };
}

// ──────────────────────────────────────────────────
// 1. AlienVault OTX — Public Threat Pulses
// ──────────────────────────────────────────────────

interface OTXPulse {
  id: string;
  name: string;
  description: string;
  created: string;
  modified: string;
  tags: string[];
  adversary: string;
  targeted_countries: string[];
  malware_families: string[];
  attack_ids: { id: string; name: string }[];
  references: string[];
  tlp: string;
}

interface LiveThreat {
  id: string;
  source: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  type: string;
  publishedAt: string;
  country: string;
  isLive: boolean;
  url?: string;
  tags?: string[];
}

function classifySeverity(pulse: OTXPulse): "critical" | "high" | "medium" | "low" {
  const text = `${pulse.name} ${pulse.description} ${pulse.tags.join(" ")}`.toLowerCase();
  if (text.includes("ransomware") || text.includes("zero-day") || text.includes("0day") || text.includes("critical") || text.includes("rce") || text.includes("remote code execution")) return "critical";
  if (text.includes("malware") || text.includes("apt") || text.includes("backdoor") || text.includes("exploit") || text.includes("credential") || text.includes("trojan")) return "high";
  if (text.includes("phishing") || text.includes("vulnerability") || text.includes("cve-") || text.includes("ddos")) return "medium";
  return "low";
}

function classifyType(pulse: OTXPulse): string {
  const text = `${pulse.name} ${pulse.description} ${pulse.tags.join(" ")}`.toLowerCase();
  if (text.includes("ransomware")) return "ransomware";
  if (text.includes("phishing") || text.includes("social engineering")) return "phishing";
  if (text.includes("ddos") || text.includes("denial")) return "ddos";
  if (text.includes("malware") || text.includes("trojan") || text.includes("backdoor")) return "malware";
  if (text.includes("data breach") || text.includes("leak") || text.includes("exfiltrat")) return "data_breach";
  if (text.includes("unauthorized") || text.includes("brute force") || text.includes("credential")) return "unauthorized_access";
  return "malware";
}

export async function fetchOTXThreats(apiKey?: string): Promise<LiveThreat[]> {
  const cached = getCached<LiveThreat[]>("otx_threats");
  if (cached) return cached;

  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (apiKey) {
      headers["X-OTX-API-KEY"] = apiKey;
    }

    // Use the activity feed (public) or subscribed feed (with key)
    const endpoint = apiKey
      ? "https://otx.alienvault.com/api/v1/pulses/subscribed?limit=20&page=1"
      : "https://otx.alienvault.com/api/v1/pulses/activity?limit=20&page=1";

    const response = await fetch(endpoint, {
      headers,
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.error(`OTX API returned ${response.status}`);
      return [];
    }

    const data = await response.json();
    const pulses: OTXPulse[] = data.results || [];

    const threats: LiveThreat[] = pulses.map((pulse) => ({
      id: `otx-${pulse.id}`,
      source: "alienvault",
      title: pulse.name.length > 120 ? pulse.name.substring(0, 117) + "..." : pulse.name,
      description: pulse.description
        ? pulse.description.substring(0, 300) + (pulse.description.length > 300 ? "..." : "")
        : "Threat intelligence pulse from AlienVault OTX. See details for IOCs and indicators.",
      severity: classifySeverity(pulse),
      type: classifyType(pulse),
      publishedAt: pulse.created,
      country: pulse.targeted_countries?.[0] || "GLOBAL",
      isLive: true,
      url: `https://otx.alienvault.com/pulse/${pulse.id}`,
      tags: pulse.tags?.slice(0, 5),
    }));

    setCache("otx_threats", threats);
    return threats;
  } catch (error) {
    console.error("Failed to fetch OTX threats:", error);
    return [];
  }
}

// ──────────────────────────────────────────────────
// 2. AbuseIPDB — IP Reputation Checker
// ──────────────────────────────────────────────────

export interface IPReputationResult {
  ipAddress: string;
  isPublic: boolean;
  abuseConfidenceScore: number;
  countryCode: string;
  isp: string;
  domain: string;
  totalReports: number;
  numDistinctUsers: number;
  lastReportedAt: string | null;
  isWhitelisted: boolean;
  usageType: string;
  isLive: boolean;
}

export async function checkIPReputation(
  ip: string,
  apiKey?: string
): Promise<IPReputationResult | null> {
  if (!apiKey) {
    return null; // Cannot check without API key
  }

  const cacheKey = `ip_${ip}`;
  const cached = getCached<IPReputationResult>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(
      `https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(ip)}&maxAgeInDays=90`,
      {
        headers: {
          Key: apiKey,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      console.error(`AbuseIPDB returned ${response.status}`);
      return null;
    }

    const json = await response.json();
    const d = json.data;

    const result: IPReputationResult = {
      ipAddress: d.ipAddress,
      isPublic: d.isPublic,
      abuseConfidenceScore: d.abuseConfidenceScore,
      countryCode: d.countryCode || "N/A",
      isp: d.isp || "Unknown",
      domain: d.domain || "N/A",
      totalReports: d.totalReports,
      numDistinctUsers: d.numDistinctUsers,
      lastReportedAt: d.lastReportedAt,
      isWhitelisted: d.isWhitelisted || false,
      usageType: d.usageType || "Unknown",
      isLive: true,
    };

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error("AbuseIPDB check failed:", error);
    return null;
  }
}

// ──────────────────────────────────────────────────
// 3. Cybersecurity News — Real RSS Feeds
// ──────────────────────────────────────────────────

interface LiveNewsArticle {
  id: string;
  title: string;
  source: string;
  url: string;
  summary: string;
  publishedAt: string;
  keywords: string;
  isLive: boolean;
}

const RSS_FEEDS = [
  { url: "https://feeds.feedburner.com/TheHackersNews", source: "The Hacker News" },
  { url: "https://www.bleepingcomputer.com/feed/", source: "BleepingComputer" },
  { url: "https://krebsonsecurity.com/feed/", source: "Krebs on Security" },
  { url: "https://www.darkreading.com/rss.xml", source: "Dark Reading" },
];

async function fetchSingleFeed(feedUrl: string, source: string): Promise<LiveNewsArticle[]> {
  try {
    const feed = await rssParser.parseURL(feedUrl);
    return (feed.items || []).slice(0, 5).map((item, idx) => {
      // Clean up description — strip HTML tags
      const rawDesc = item.contentSnippet || item.content || item.summary || "";
      const cleanDesc = rawDesc.replace(/<[^>]*>/g, "").substring(0, 250);

      // Extract keywords from title
      const keywords = (item.title || "")
        .split(/[\s,\-:]+/)
        .filter((w) => w.length > 4)
        .slice(0, 5)
        .join(",");

      return {
        id: `rss-${source.replace(/\s/g, "")}-${idx}`,
        title: item.title || "Untitled",
        source,
        url: item.link || feedUrl,
        summary: cleanDesc + (rawDesc.length > 250 ? "..." : ""),
        publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
        keywords,
        isLive: true,
      };
    });
  } catch (error) {
    console.error(`Failed to fetch RSS from ${source}:`, error);
    return [];
  }
}

export async function fetchLiveNews(): Promise<LiveNewsArticle[]> {
  const cached = getCached<LiveNewsArticle[]>("live_news");
  if (cached) return cached;

  try {
    // Fetch all feeds in parallel
    const results = await Promise.allSettled(
      RSS_FEEDS.map((f) => fetchSingleFeed(f.url, f.source))
    );

    const articles: LiveNewsArticle[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") {
        articles.push(...result.value);
      }
    }

    // Sort by date, newest first
    articles.sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    // Take top 15 articles across all sources
    const top = articles.slice(0, 15);
    setCache("live_news", top);
    return top;
  } catch (error) {
    console.error("Failed to fetch live news:", error);
    return [];
  }
}

// ──────────────────────────────────────────────────
// Feed status helper
// ──────────────────────────────────────────────────

export function getFeedStatus() {
  return {
    otx: {
      name: "AlienVault OTX",
      status: "active",
      type: "Threat Intelligence",
      requiresKey: false,
      description: "Real-time threat pulses from the world's largest open threat intelligence community",
      cached: !!getCached("otx_threats"),
    },
    abuseipdb: {
      name: "AbuseIPDB",
      status: process.env.ABUSEIPDB_API_KEY ? "active" : "needs_key",
      type: "IP Reputation",
      requiresKey: true,
      description: "Crowdsourced IP reputation database (free: 1,000 checks/day)",
      cached: false,
    },
    news: {
      name: "Cybersecurity News (RSS)",
      status: "active",
      type: "News Feeds",
      requiresKey: false,
      description: "Live news from The Hacker News, BleepingComputer, Krebs on Security, Dark Reading",
      cached: !!getCached("live_news"),
    },
  };
}
