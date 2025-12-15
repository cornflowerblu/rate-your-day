#!/bin/bash

# Script to deploy Rate Your Day to Vercel
# Requirements: Vercel CLI installed (npm i -g vercel)

set -e

echo "🚀 Deploying Rate Your Day to Vercel"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if logged in to Vercel
echo "🔐 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null 2>&1; then
    echo "Please login to Vercel:"
    vercel login
fi

echo "✅ Logged in to Vercel as: $(vercel whoami)"
echo ""

# Link project to Vercel (or create new project)
echo "🔗 Linking project to Vercel..."
if [ ! -f ".vercel/project.json" ]; then
    echo "Creating new Vercel project..."
    vercel link --yes
else
    echo "Project already linked"
fi

echo ""
echo "📝 Setting environment variables..."

# Read from .env.local
DATABASE_URL=$(grep DATABASE_URL .env.local | cut -d '=' -f2- | tr -d '"')
NEXTAUTH_SECRET=$(grep NEXTAUTH_SECRET .env.local | cut -d '=' -f2- | tr -d '"')
AUTH_MICROSOFT_ENTRA_ID_ID=$(grep AUTH_MICROSOFT_ENTRA_ID_ID .env.local | cut -d '=' -f2- | tr -d '"')
AUTH_MICROSOFT_ENTRA_ID_SECRET=$(grep AUTH_MICROSOFT_ENTRA_ID_SECRET .env.local | cut -d '=' -f2- | tr -d '"')
AUTH_MICROSOFT_ENTRA_ID_ISSUER=$(grep AUTH_MICROSOFT_ENTRA_ID_ISSUER .env.local | cut -d '=' -f2- | tr -d '"')
OWNER_EMAIL=$(grep OWNER_EMAIL .env.local | cut -d '=' -f2- | tr -d '"')

# Set environment variables in Vercel (for production and preview)
vercel env add DATABASE_URL production <<< "$DATABASE_URL" || true
vercel env add DATABASE_URL preview <<< "$DATABASE_URL" || true

vercel env add NEXTAUTH_SECRET production <<< "$NEXTAUTH_SECRET" || true
vercel env add NEXTAUTH_SECRET preview <<< "$NEXTAUTH_SECRET" || true

vercel env add AUTH_MICROSOFT_ENTRA_ID_ID production <<< "$AUTH_MICROSOFT_ENTRA_ID_ID" || true
vercel env add AUTH_MICROSOFT_ENTRA_ID_ID preview <<< "$AUTH_MICROSOFT_ENTRA_ID_ID" || true

vercel env add AUTH_MICROSOFT_ENTRA_ID_SECRET production <<< "$AUTH_MICROSOFT_ENTRA_ID_SECRET" || true
vercel env add AUTH_MICROSOFT_ENTRA_ID_SECRET preview <<< "$AUTH_MICROSOFT_ENTRA_ID_SECRET" || true

vercel env add AUTH_MICROSOFT_ENTRA_ID_ISSUER production <<< "$AUTH_MICROSOFT_ENTRA_ID_ISSUER" || true
vercel env add AUTH_MICROSOFT_ENTRA_ID_ISSUER preview <<< "$AUTH_MICROSOFT_ENTRA_ID_ISSUER" || true

vercel env add OWNER_EMAIL production <<< "$OWNER_EMAIL" || true
vercel env add OWNER_EMAIL preview <<< "$OWNER_EMAIL" || true

echo "✅ Environment variables configured"
echo ""

# Deploy to production
echo "🚀 Deploying to production..."
DEPLOYMENT_URL=$(vercel --prod --yes 2>&1 | grep -o 'https://[^ ]*' | head -1)

echo ""
echo "================================================"
echo "✅ Deployment successful!"
echo "================================================"
echo ""
echo "Production URL: $DEPLOYMENT_URL"
echo ""
echo "⚠️  IMPORTANT: Update Entra ID redirect URIs"
echo ""
echo "Run this command to add the Vercel URL to Entra ID:"
echo ""
echo "az ad app update --id $AUTH_MICROSOFT_ENTRA_ID_ID \\"
echo "  --web-redirect-uris \\"
echo "    'http://localhost:3000/api/auth/callback/microsoft-entra-id' \\"
echo "    '${DEPLOYMENT_URL}/api/auth/callback/microsoft-entra-id'"
echo ""
echo "Or run: ./scripts/update-entra-redirect-uris.sh"
echo ""
