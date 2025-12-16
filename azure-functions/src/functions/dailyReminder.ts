/**
 * Daily Reminder Azure Function (v4 Programming Model)
 *
 * Timer Trigger that runs daily at 9 PM CST (3 AM UTC)
 * Checks which users haven't rated their day and sends push notifications
 *
 * Schedule: 0 0 3 * * * (CRON format)
 * - Every day at 3:00 AM UTC (9:00 PM CST when CST = UTC-6)
 * - Note: During CDT (Central Daylight Time, UTC-5), this runs at 10 PM
 *
 * Environment Variables Required:
 * - DATABASE_URL: MongoDB connection string for Cosmos DB
 * - VAPID_PUBLIC_KEY: VAPID public key for web-push
 * - VAPID_PRIVATE_KEY: VAPID private key for web-push
 * - VAPID_SUBJECT: Contact info (mailto: or URL)
 */

import { app, InvocationContext, Timer, HttpRequest, HttpResponseInit } from '@azure/functions'
import mongoose from 'mongoose'
import webpush from 'web-push'

// Define Mongoose schemas for Azure Functions
interface IDayRating {
  date: string
  rating: number
  notes?: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

interface IPushSubscription {
  userId: string
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
  createdAt: Date
  updatedAt: Date
}

const DayRatingSchema = new mongoose.Schema<IDayRating>(
  {
    date: { type: String, required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 4 },
    notes: { type: String, maxlength: 280 },
    userId: { type: String, required: true, index: true },
  },
  { timestamps: true }
)

const PushSubscriptionSchema = new mongoose.Schema<IPushSubscription>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    endpoint: { type: String, required: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
  },
  { timestamps: true }
)

// Get or create models (handles re-compilation in Azure Functions)
const DayRating =
  mongoose.models.DayRating || mongoose.model<IDayRating>('DayRating', DayRatingSchema)
const PushSubscription =
  mongoose.models.PushSubscription ||
  mongoose.model<IPushSubscription>('PushSubscription', PushSubscriptionSchema)

// Configure VAPID details for web-push
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
} else {
  console.error('VAPID environment variables not configured')
}

/**
 * Connect to MongoDB
 */
async function connectDB(): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    return // Already connected
  }

  const mongoUri = process.env.DATABASE_URL
  if (!mongoUri) {
    throw new Error('DATABASE_URL environment variable not set')
  }

  await mongoose.connect(mongoUri, {
    bufferCommands: false,
  })
  console.log('✅ MongoDB connected via Mongoose')
}

/**
 * Core logic for sending daily reminders
 * Used by both timer trigger and HTTP trigger (for testing)
 */
async function sendDailyReminders(context: InvocationContext): Promise<{
  success: boolean
  timestamp: string
  today: string
  summary: {
    notificationsSent: number
    notificationsFailed: number
    totalSubscriptions: number
  }
  errors?: string[]
}> {
  const timeStamp = new Date().toISOString()

  context.log(`Daily reminder function triggered at: ${timeStamp}`)

  try {
    // Connect to MongoDB
    await connectDB()

    // Get today's date in YYYY-MM-DD format (CST timezone)
    // Note: Using UTC-6 offset for CST (not accounting for DST)
    const now = new Date()
    const cstOffset = -6 * 60 // CST is UTC-6
    const cstTime = new Date(now.getTime() + cstOffset * 60 * 1000)
    const today = cstTime.toISOString().split('T')[0]

    context.log(`Checking for unrated days on date: ${today}`)

    // Get all push subscriptions
    const allSubscriptions = await PushSubscription.find()
    context.log(`Found ${allSubscriptions.length} push subscription(s)`)

    if (allSubscriptions.length === 0) {
      context.log('No subscriptions found, exiting')
      await mongoose.disconnect()
      return {
        success: true,
        timestamp: timeStamp,
        today,
        summary: {
          notificationsSent: 0,
          notificationsFailed: 0,
          totalSubscriptions: 0,
        },
      }
    }

    let notificationsSent = 0
    let notificationsFailed = 0
    const errors: string[] = []

    // Check each user
    for (const subscription of allSubscriptions) {
      try {
        // Check if user has rated today
        const rating = await DayRating.findOne({
          userId: subscription.userId,
          date: today,
        })

        if (rating) {
          context.log(`User ${subscription.userId} has already rated today, skipping`)
          continue
        }

        context.log(`User ${subscription.userId} hasn't rated today, sending notification`)

        // Prepare push notification payload
        const payload = JSON.stringify({
          title: 'Rate Your Day',
          body: "Don't forget to rate your day!",
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-192x192.png',
          tag: 'daily-reminder',
          requireInteraction: false,
          data: {
            url: '/',
            dateContext: today,
          },
        })

        // Send push notification
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: subscription.keys as { p256dh: string; auth: string },
            },
            payload
          )

          notificationsSent++
          context.log(`Successfully sent notification to ${subscription.userId}`)
        } catch (pushError) {
          notificationsFailed++
          const errorMessage = `Failed to send notification to ${subscription.userId}: ${pushError}`
          context.error(errorMessage)
          errors.push(errorMessage)

          // Check if subscription is no longer valid (410 Gone)
          if (
            pushError &&
            typeof pushError === 'object' &&
            'statusCode' in pushError &&
            pushError.statusCode === 410
          ) {
            context.log(
              `Subscription for ${subscription.userId} is no longer valid, removing from database`
            )
            try {
              await PushSubscription.findByIdAndDelete(subscription._id)
              context.log(`Removed invalid subscription for ${subscription.userId}`)
            } catch (deleteError) {
              context.error(
                `Failed to remove invalid subscription for ${subscription.userId}: ${deleteError}`
              )
            }
          }
        }
      } catch (error) {
        notificationsFailed++
        const errorMessage = `Error processing user ${subscription.userId}: ${error}`
        context.error(errorMessage)
        errors.push(errorMessage)
      }
    }

    // Log summary
    context.log('Daily reminder execution complete')
    context.log(`Notifications sent: ${notificationsSent}`)
    context.log(`Notifications failed: ${notificationsFailed}`)

    if (errors.length > 0) {
      context.error('Errors encountered:')
      errors.forEach((error) => context.error(error))
    }

    // Clean up MongoDB connection
    await mongoose.disconnect()

    // Return summary
    return {
      success: true,
      timestamp: timeStamp,
      today,
      summary: {
        notificationsSent,
        notificationsFailed,
        totalSubscriptions: allSubscriptions.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    }
  } catch (error) {
    context.error('Fatal error in daily reminder function:', error)

    // Clean up MongoDB connection
    await mongoose.disconnect()

    // Return error response
    return {
      success: false,
      timestamp: timeStamp,
      today: '',
      summary: {
        notificationsSent: 0,
        notificationsFailed: 0,
        totalSubscriptions: 0,
      },
      errors: [error instanceof Error ? error.message : String(error)],
    }
  }
}

/**
 * Timer Trigger - Runs at 3 AM UTC (9 PM CST) daily
 */
export async function dailyReminderTimer(
  myTimer: Timer,
  context: InvocationContext
): Promise<void> {
  if (myTimer.isPastDue) {
    context.warn('Timer is running late!')
  }

  await sendDailyReminders(context)
}

/**
 * HTTP Trigger - For manual testing
 */
export async function dailyReminderHttp(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('Manual trigger via HTTP')

  const result = await sendDailyReminders(context)

  return {
    status: result.success ? 200 : 500,
    jsonBody: result,
  }
}

// Register Timer Trigger (scheduled)
app.timer('dailyReminderTimer', {
  schedule: '0 35 16 * * *', // 4:35 PM UTC = 10:35 AM CST (TESTING)
  handler: dailyReminderTimer,
})

// Register HTTP Trigger (manual testing)
app.http('dailyReminderHttp', {
  methods: ['GET', 'POST'],
  authLevel: 'function',
  handler: dailyReminderHttp,
})
