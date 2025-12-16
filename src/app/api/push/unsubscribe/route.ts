import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongoose'
import PushSubscription from '@/lib/models/PushSubscription'

/**
 * POST /api/push/unsubscribe
 *
 * Removes a Web Push API subscription from the database
 * Requires authentication
 *
 * Response:
 * - 200: Subscription removed successfully
 * - 401: Unauthorized
 * - 404: No subscription found
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

    // Connect to MongoDB via Mongoose
    await connectDB()

    // Try to delete the subscription
    const result = await PushSubscription.findOneAndDelete({ userId })

    if (!result) {
      return NextResponse.json({ message: 'No subscription found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Push subscription removed successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error removing push subscription:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
