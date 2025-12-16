import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongoose'
import DayRating from '@/lib/models/DayRating'
import { MonthRatingsResponse } from '@/lib/types'

/**
 * GET /api/ratings?month=YYYY-MM
 *
 * Fetches all ratings for a specific month for the authenticated user
 *
 * Query Parameters:
 * - month (required): Month in YYYY-MM format (e.g., "2025-12")
 *
 * Returns:
 * - 200: Array of ratings for the month
 * - 400: Missing or invalid month parameter
 * - 401: Unauthorized (not authenticated)
 * - 500: Server error
 *
 * Example:
 * GET /api/ratings?month=2025-12
 * Response:
 * {
 *   "ratings": [
 *     { "id": "...", "date": "2025-12-01", "rating": 4, "notes": "Great day!", ... },
 *     { "id": "...", "date": "2025-12-15", "rating": 3, "notes": null, ... }
 *   ],
 *   "month": "2025-12"
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get month parameter from query string
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')

    // Validate month parameter
    if (!month) {
      return NextResponse.json({ error: 'Missing required parameter: month' }, { status: 400 })
    }

    // Validate month format (YYYY-MM)
    const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/
    if (!monthRegex.test(month)) {
      return NextResponse.json(
        { error: 'Invalid month format. Expected YYYY-MM (e.g., 2025-12)' },
        { status: 400 }
      )
    }

    // Calculate date range for the month
    // MongoDB query: find all dates that start with the month prefix
    const startDate = `${month}-01` // e.g., "2025-12-01"
    const [year, monthNum] = month.split('-')
    const lastDay = new Date(parseInt(year), parseInt(monthNum), 0).getDate() // Get last day of month
    const endDate = `${month}-${lastDay.toString().padStart(2, '0')}` // e.g., "2025-12-31"

    // Connect to MongoDB via Mongoose
    await connectDB()

    // Fetch ratings for the month using Mongoose
    const ratings = await DayRating.find({
      userId: session.user.email,
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    })
      .sort({ date: 1 }) // Sort ascending by date
      .select('_id date rating notes createdAt updatedAt')
      .lean() // Return plain JavaScript objects for better performance

    // Format response
    const response: MonthRatingsResponse = {
      ratings: ratings.map((rating) => ({
        id: rating._id.toString(),
        date: rating.date,
        rating: rating.rating as 1 | 2 | 3 | 4,
        notes: rating.notes || undefined,
        createdAt: rating.createdAt.toISOString(),
        updatedAt: rating.updatedAt.toISOString(),
      })),
      month,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Error fetching ratings:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
