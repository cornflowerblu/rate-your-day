import NextAuth from 'next-auth'
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Restrict access to owner only (single user app)
      const ownerEmail = process.env.OWNER_EMAIL
      if (!ownerEmail) {
        console.error('OWNER_EMAIL environment variable not set')
        return false
      }
      return user.email === ownerEmail
    },
    async session({ session, token }) {
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
