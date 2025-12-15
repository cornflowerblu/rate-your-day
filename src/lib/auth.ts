import NextAuth from 'next-auth'
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id'

// Debug: Log environment variables at module load time
console.log('[AUTH DEBUG] Environment check (RAW):', {
  hasClientId: !!process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
  hasClientSecret: !!process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
  hasIssuer: !!process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
  hasAuthUrl: !!process.env.AUTH_URL,
  hasAuthSecret: !!process.env.AUTH_SECRET,
  hasTrustHost: !!process.env.AUTH_TRUST_HOST,
  clientIdLength: process.env.AUTH_MICROSOFT_ENTRA_ID_ID?.length || 0,
  clientSecretLength: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET?.length || 0,
  issuerValue: JSON.stringify(process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER),
  clientIdValue: JSON.stringify(process.env.AUTH_MICROSOFT_ENTRA_ID_ID),
  // Mask the secret - just show first and last 4 chars
  clientSecretMasked: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET
    ? `${process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET.substring(0, 4)}...${process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET.substring(process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET.length - 4)}`
    : 'undefined',
})

console.log('[AUTH DEBUG] Environment check (TRIMMED):', {
  clientIdLength: process.env.AUTH_MICROSOFT_ENTRA_ID_ID?.trim().length || 0,
  clientSecretLength: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET?.trim().length || 0,
  issuerValue: JSON.stringify(process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER?.trim()),
  clientIdValue: JSON.stringify(process.env.AUTH_MICROSOFT_ENTRA_ID_ID?.trim()),
  clientSecretMasked: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET?.trim()
    ? `${process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET.trim().substring(0, 4)}...${process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET.trim().substring(process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET.trim().length - 4)}`
    : 'undefined',
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!.trim(),
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!.trim(),
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER!.trim(),
    }),
  ],
  events: {
    async signIn({ user, account }) {
      console.log('[AUTH DEBUG] signIn event:', {
        userEmail: user.email,
        provider: account?.provider,
      })
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        console.log('[AUTH DEBUG] signIn callback triggered')
        console.log('[AUTH DEBUG] User:', JSON.stringify(user))
        console.log('[AUTH DEBUG] Account:', JSON.stringify(account))
        console.log('[AUTH DEBUG] Profile:', JSON.stringify(profile))

        // Restrict access to owner only (single user app)
        const ownerEmail = process.env.OWNER_EMAIL?.trim()
        if (!ownerEmail) {
          console.error('[AUTH DEBUG] OWNER_EMAIL environment variable not set')
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
          console.error('[AUTH DEBUG] User email could not be determined from OAuth response')
          return false
        }

        const userEmailLower = userEmail.trim().toLowerCase()
        const ownerEmailLower = ownerEmail.trim().toLowerCase()
        const isAuthorized = userEmailLower === ownerEmailLower

        console.log('[AUTH DEBUG] Authorization check:', {
          userEmailRaw: JSON.stringify(user.email),
          userEmailParsed: JSON.stringify(userEmail),
          userEmailLower: JSON.stringify(userEmailLower),
          ownerEmailRaw: JSON.stringify(process.env.OWNER_EMAIL),
          ownerEmailLower: JSON.stringify(ownerEmailLower),
          matches: userEmailLower === ownerEmailLower,
          isAuthorized,
        })

        if (!isAuthorized) {
          console.error('[AUTH DEBUG] Access denied - user email does not match owner email')
        }

        return isAuthorized
      } catch (error) {
        console.error('[AUTH DEBUG] Exception in signIn callback:', error)
        return false
      }
    },
    async session({ session, token }) {
      console.log('[AUTH DEBUG] session callback triggered:', {
        hasSession: !!session,
        hasUser: !!session.user,
        hasToken: !!token,
        tokenSub: token.sub,
      })

      // Add user ID to session for database queries
      if (session.user) {
        session.user.id = token.sub!
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
})
