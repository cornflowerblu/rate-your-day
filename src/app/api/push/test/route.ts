import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongoose'
import PushSubscription from '@/lib/models/PushSubscription'
import webpush from 'web-push'

/**
 * POST /api/push/test
 *
 * Test endpoint to send a push notification immediately
 * Useful for testing the notification flow without waiting for the timer
 *
 * IMPORTANT: Only available in development mode
 *
 * Response:
 * - 200: Notification sent successfully
 * - 401: Unauthorized
 * - 404: No push subscription found
 * - 500: Server error
 */
export async function POST(request: NextRequest) {
  // Only allow in development mode
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Test endpoint not available in production' },
      { status: 403 }
    )
  }

  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.email

    // Check if VAPID keys are configured
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
    const vapidSubject = process.env.VAPID_SUBJECT

    if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
      return NextResponse.json(
        {
          error: 'VAPID keys not configured',
          details: {
            publicKey: !!vapidPublicKey,
            privateKey: !!vapidPrivateKey,
            subject: !!vapidSubject,
          },
        },
        { status: 500 }
      )
    }

    // Configure VAPID
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

    // Connect to MongoDB via Mongoose
    await connectDB()

    // Get user's push subscription
    const subscription = await PushSubscription.findOne({ userId })

    if (!subscription) {
      return NextResponse.json(
        { error: 'No push subscription found. Please enable notifications first.' },
        { status: 404 }
      )
    }

    // Prepare notification payload
    const payload = JSON.stringify({
      title: 'Test Notification',
      body: 'This is a test push notification from Rate Your Day!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: 'test-notification',
      requireInteraction: false,
      data: {
        url: '/',
        test: true,
        timestamp: new Date().toISOString(),
      },
    })

    // Send push notification
    try {
      const result = await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: subscription.keys as { p256dh: string; auth: string },
        },
        payload
      )

      return NextResponse.json(
        {
          message: 'Test notification sent successfully',
          statusCode: result.statusCode,
          userId,
        },
        { status: 200 }
      )
    } catch (pushError) {
      console.error('Push notification error:', pushError)

      // Check if subscription is invalid (410 Gone)
      if (
        pushError &&
        typeof pushError === 'object' &&
        'statusCode' in pushError &&
        pushError.statusCode === 410
      ) {
        // Remove invalid subscription
        await PushSubscription.findByIdAndDelete(subscription._id)

        return NextResponse.json(
          {
            error: 'Push subscription is no longer valid (removed from database)',
            statusCode: 410,
          },
          { status: 410 }
        )
      }

      throw pushError
    }
  } catch (error) {
    console.error('Error sending test notification:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
