import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongoose'
import PushSubscription from '@/lib/models/PushSubscription'

/**
 * POST /api/push/subscribe
 *
 * Saves a Web Push API subscription to the database
 * Requires authentication
 *
 * Request body:
 * {
 *   endpoint: string,
 *   expirationTime: number | null,
 *   keys: {
 *     p256dh: string,
 *     auth: string
 *   }
 * }
 *
 * Response:
 * - 200: Subscription saved successfully
 * - 400: Invalid subscription data
 * - 401: Unauthorized
 * - 500: Server error
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.email

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    // Validate subscription data
    if (!body.endpoint || typeof body.endpoint !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid endpoint' }, { status: 400 })
    }

    if (!body.keys || !body.keys.p256dh || !body.keys.auth) {
      return NextResponse.json(
        { error: 'Missing or invalid keys (p256dh, auth required)' },
        { status: 400 }
      )
    }

    // Connect to MongoDB via Mongoose
    await connectDB()

    // Save or update subscription in database using Mongoose
    // Using findOneAndUpdate with upsert to handle both new subscriptions and updates
    const subscription = await PushSubscription.findOneAndUpdate(
      { userId },
      {
        userId,
        endpoint: body.endpoint,
        keys: {
          p256dh: body.keys.p256dh,
          auth: body.keys.auth,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    )

    if (!subscription) {
      throw new Error('Failed to save push subscription')
    }

    return NextResponse.json(
      {
        message: 'Push subscription saved successfully',
        id: subscription._id.toString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error saving push subscription:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
