
export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  tags: string[];
  readTime: string;
  coverImage: string;
  initialLikes: number;
  likes?: number;
  views?: number;
}

export interface Comment {
  id: string;
  author: string;
  date: string;
  content: string;
}

// ── 選舉模塊 ──────────────────────────────────────

export interface ElectionCandidate {
  name: string
  party: string
  color: string   // chart hex color，例如 '#2563eb'
}

export interface ElectionRace {
  id: string          // citySlug，例如 'taipei'
  city: string        // 顯示名稱，例如 '台北市'
  region: string      // '北部' | '中部' | '南部' | '東部' | '離島'
  candidates: ElectionCandidate[]
  electionDate: string
  isActive: boolean
  order: number       // 儀表板排序
}

export interface PollResult {
  name: string
  percentage: number
}

export interface ElectionPoll {
  id: string
  raceId: string
  source: string       // 民調機構名稱
  date: string         // 民調日期 YYYY-MM-DD
  sampleSize?: number
  marginOfError?: number
  results: PollResult[]
  url?: string
  notes?: string
}
