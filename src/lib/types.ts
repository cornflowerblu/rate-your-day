// Entity types matching Prisma schema

export interface DayRating {
  id: string
  date: string // ISO format: YYYY-MM-DD
  rating: 1 | 2 | 3 | 4 // 1=angry, 2=sad, 3=average, 4=happy
  notes?: string | null // Optional, max 280 characters
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface PushSubscription {
  id: string
  userId: string
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
  createdAt: Date
  updatedAt: Date
}

// API request/response types

export interface CreateRatingRequest {
  date: string
  rating: 1 | 2 | 3 | 4
  notes?: string
}

export interface UpdateRatingRequest {
  rating?: 1 | 2 | 3 | 4
  notes?: string
}

export interface RatingResponse {
  id: string
  date: string
  rating: 1 | 2 | 3 | 4
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface MonthRatingsResponse {
  ratings: RatingResponse[]
  month: string // YYYY-MM format
}

export interface SubscribePushRequest {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

// UI types

export type MoodLevel = 1 | 2 | 3 | 4

export interface MoodEmoji {
  level: MoodLevel
  emoji: string
  label: string
  color: string
}

export const MOOD_EMOJIS: Record<MoodLevel, MoodEmoji> = {
  1: { level: 1, emoji: '😠', label: 'Angry', color: '#ef4444' },
  2: { level: 2, emoji: '😢', label: 'Sad', color: '#f59e0b' },
  3: { level: 3, emoji: '😐', label: 'Average', color: '#6b7280' },
  4: { level: 4, emoji: '😊', label: 'Happy', color: '#10b981' },
}

// NextAuth types extension

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string
      image?: string
    }
  }
}
