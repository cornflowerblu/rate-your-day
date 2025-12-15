import NextAuth from 'next-auth'
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id'

// Debug: Log environment variables at module load time
console.log('[AUTH DEBUG] Environment check:', {
  hasClientId: !!process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
  hasClientSecret: !!process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
  hasIssuer: !!process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
  hasAuthUrl: !!process.env.AUTH_URL,
  hasAuthSecret: !!process.env.AUTH_SECRET,
  hasTrustHost: !!process.env.AUTH_TRUST_HOST,
  clientIdLength: process.env.AUTH_MICROSOFT_ENTRA_ID_ID?.length || 0,
  clientSecretLength: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET?.length || 0,
  issuerValue: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
  clientIdValue: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
  // Mask the secret - just show first and last 4 chars
  clientSecretMasked: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET
    ? `${process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET.substring(0, 4)}...${process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET.substring(process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET.length - 4)}`
    : 'undefined',
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER!,
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
      console.log('[AUTH DEBUG] signIn callback triggered:', {
        userEmail: user.email,
        accountProvider: account?.provider,
        accountType: account?.type,
        hasProfile: !!profile,
      })

      // Restrict access to owner only (single user app)
      const ownerEmail = process.env.OWNER_EMAIL
      if (!ownerEmail) {
        console.error('[AUTH DEBUG] OWNER_EMAIL environment variable not set')
        return false
      }

      const isAuthorized = user.email === ownerEmail
      console.log('[AUTH DEBUG] Authorization check:', {
        userEmail: user.email,
        ownerEmail,
        isAuthorized,
      })

      return isAuthorized
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
