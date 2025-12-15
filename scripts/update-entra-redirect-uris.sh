#!/bin/bash

# Script to update Entra ID redirect URIs with Vercel URL
# Run this after deploying to Vercel

set -e

# Read from .env.local
AUTH_MICROSOFT_ENTRA_ID_ID=$(grep AUTH_MICROSOFT_ENTRA_ID_ID .env.local | cut -d '=' -f2- | tr -d '"')

echo "🔐 Updating Microsoft Entra ID redirect URIs"
echo ""

# Get Vercel production URL
if [ ! -f ".vercel/project.json" ]; then
    echo "❌ No Vercel project found. Run deploy-to-vercel.sh first."
    exit 1
fi

echo "📋 Getting Vercel production URL..."
VERCEL_URL=$(vercel inspect --wait 2>&1 | grep -o 'https://[^ ]*\.vercel\.app' | head -1)

if [ -z "$VERCEL_URL" ]; then
    echo "❌ Could not get Vercel URL. Please provide it manually:"
    read -p "Enter your Vercel production URL: " VERCEL_URL
fi

echo "🔗 Vercel URL: $VERCEL_URL"
echo ""

# Update Entra ID app registration
echo "🔄 Updating redirect URIs..."
az ad app update \
    --id "$AUTH_MICROSOFT_ENTRA_ID_ID" \
    --web-redirect-uris \
        "http://localhost:3000/api/auth/callback/microsoft-entra-id" \
        "${VERCEL_URL}/api/auth/callback/microsoft-entra-id"

echo ""
echo "✅ Redirect URIs updated successfully!"
echo ""
echo "Configured URIs:"
echo "  - http://localhost:3000/api/auth/callback/microsoft-entra-id (local)"
echo "  - ${VERCEL_URL}/api/auth/callback/microsoft-entra-id (production)"
echo ""
echo "You can now sign in at: ${VERCEL_URL}"
