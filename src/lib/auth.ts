import NextAuth from 'next-auth'
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id'

// Validate and trim required environment variables
const microsoftEntraId = process.env.AUTH_MICROSOFT_ENTRA_ID_ID
const microsoftEntraSecret = process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET
const microsoftEntraIssuer = process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER

if (!microsoftEntraId) {
  throw new Error('Missing required environment variable: AUTH_MICROSOFT_ENTRA_ID_ID')
}
if (!microsoftEntraSecret) {
  throw new Error('Missing required environment variable: AUTH_MICROSOFT_ENTRA_ID_SECRET')
}
if (!microsoftEntraIssuer) {
  throw new Error('Missing required environment variable: AUTH_MICROSOFT_ENTRA_ID_ISSUER')
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    MicrosoftEntraID({
      clientId: microsoftEntraId.trim(),
      clientSecret: microsoftEntraSecret.trim(),
      issuer: microsoftEntraIssuer.trim(),
    }),
  ],
  callbacks: {
    async signIn({ user, profile }) {
      try {
        // Restrict access to owner only (single user app)
        const ownerEmail = process.env.OWNER_EMAIL?.trim()
        if (!ownerEmail) {
          console.error('OWNER_EMAIL environment variable not set')
          return false
        }

        // Extract email from user object or profile
        // For guest users, email might be in preferred_username as: rogeru63_gmail.com#EXT#@tenant
        let userEmail = user.email
        const extendedProfile = profile as Record<string, unknown> | undefined

        if (!userEmail && extendedProfile?.preferred_username) {
          const preferredUsername = String(extendedProfile.preferred_username)
          // Parse guest user format: rogeru63_gmail.com#EXT#@tenant -> rogeru63@gmail.com
          if (preferredUsername.includes('#EXT#')) {
            const emailPart = preferredUsername.split('#EXT#')[0]
            userEmail = emailPart.replace(/_/g, '@')
          } else {
            userEmail = preferredUsername
          }
        }

        if (!userEmail) {
          console.error('User email could not be determined from OAuth response')
          return false
        }

        const userEmailLower = userEmail.trim().toLowerCase()
        const ownerEmailLower = ownerEmail.trim().toLowerCase()
        const isAuthorized = userEmailLower === ownerEmailLower

        if (!isAuthorized) {
          console.error('Access denied - user email does not match owner email')
        }

        return isAuthorized
      } catch (error) {
        console.error('Exception in signIn callback:', error)
        return false
      }
    },
    async session({ session, token }) {
      // Add user ID to session for database queries
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
})
