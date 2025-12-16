import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongoose'
import DayRating from '@/lib/models/DayRating'
import { CreateRatingRequest, RatingResponse } from '@/lib/types'

// GET /api/ratings/[date] - Get rating for specific date
export async function GET(request: NextRequest, { params }: { params: Promise<{ date: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { date } = await params

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 })
    }

    // Connect to MongoDB via Mongoose
    await connectDB()

    const rating = await DayRating.findOne({
      date,
      userId: session.user.email,
    })

    if (!rating) {
      return NextResponse.json({ error: 'Rating not found' }, { status: 404 })
    }

    const response: RatingResponse = {
      id: rating._id.toString(),
      date: rating.date,
      rating: rating.rating as 1 | 2 | 3 | 4,
      notes: rating.notes || undefined,
      createdAt: rating.createdAt.toISOString(),
      updatedAt: rating.updatedAt.toISOString(),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching rating:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/ratings/[date] - Create or update rating for specific date
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { date } = await params

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 })
    }

    // Parse request body
    const body = (await request.json()) as CreateRatingRequest

    // Validate rating value
    if (!body.rating || ![1, 2, 3, 4].includes(body.rating)) {
      return NextResponse.json({ error: 'Invalid rating. Must be 1, 2, 3, or 4' }, { status: 400 })
    }

    // Validate notes length if provided
    if (body.notes && body.notes.length > 280) {
      return NextResponse.json({ error: 'Notes must not exceed 280 characters' }, { status: 400 })
    }

    // Validate date is not in the future
    const ratingDate = new Date(date)
    const today = new Date()
    today.setHours(23, 59, 59, 999) // End of today
    if (ratingDate > today) {
      return NextResponse.json({ error: 'Cannot rate future dates' }, { status: 400 })
    }

    // Connect to MongoDB via Mongoose
    await connectDB()

    // Upsert rating using Mongoose findOneAndUpdate
    const rating = await DayRating.findOneAndUpdate(
      {
        date,
        userId: session.user.email,
      },
      {
        rating: body.rating,
        notes: body.notes || null,
        userId: session.user.email,
      },
      {
        upsert: true, // Create if doesn't exist
        new: true, // Return updated document
        runValidators: true, // Run schema validations
      }
    )

    if (!rating) {
      throw new Error('Failed to create/update rating')
    }

    const response: RatingResponse = {
      id: rating._id.toString(),
      date: rating.date,
      rating: rating.rating as 1 | 2 | 3 | 4,
      notes: rating.notes || undefined,
      createdAt: rating.createdAt.toISOString(),
      updatedAt: rating.updatedAt.toISOString(),
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Error saving rating:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/ratings/[date] - Delete rating for specific date (for future use)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { date } = await params

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 })
    }

    // Connect to MongoDB via Mongoose
    await connectDB()

    await DayRating.deleteMany({
      date,
      userId: session.user.email,
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error deleting rating:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
