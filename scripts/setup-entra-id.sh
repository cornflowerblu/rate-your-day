#!/bin/bash

# Script to create Microsoft Entra ID app registration for Rate Your Day
# Requirements: Azure CLI installed and logged in (az login)

set -e

APP_NAME="Rate Your Day"
REDIRECT_URI_LOCAL="http://localhost:3000/api/auth/callback/microsoft-entra-id"
REDIRECT_URI_PROD="https://your-app.vercel.app/api/auth/callback/microsoft-entra-id"

echo "🚀 Creating Entra ID App Registration for: $APP_NAME"
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI not found. Please install it first:"
    echo "   https://learn.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in
if ! az account show &> /dev/null; then
    echo "❌ Not logged into Azure. Running 'az login'..."
    az login
fi

# Get current subscription
SUBSCRIPTION=$(az account show --query name -o tsv)
TENANT_ID=$(az account show --query tenantId -o tsv)
echo "📋 Using subscription: $SUBSCRIPTION"
echo "📋 Tenant ID: $TENANT_ID"
echo ""

# Create the app registration
echo "📝 Creating app registration..."
APP_ID=$(az ad app create \
    --display-name "$APP_NAME" \
    --sign-in-audience "AzureADMyOrg" \
    --web-redirect-uris "$REDIRECT_URI_LOCAL" "$REDIRECT_URI_PROD" \
    --enable-id-token-issuance true \
    --query appId -o tsv)

echo "✅ App created with Client ID: $APP_ID"

# Create a client secret
echo "🔐 Creating client secret..."
SECRET_OUTPUT=$(az ad app credential reset \
    --id "$APP_ID" \
    --append \
    --display-name "NextAuth Secret" \
    --query password -o tsv)

echo "✅ Client secret created"
echo ""

# Output environment variables
echo "================================================"
echo "📝 Add these to your .env.local file:"
echo "================================================"
echo ""
echo "AUTH_MICROSOFT_ENTRA_ID_ID=\"$APP_ID\""
echo "AUTH_MICROSOFT_ENTRA_ID_SECRET=\"$SECRET_OUTPUT\""
echo "AUTH_MICROSOFT_ENTRA_ID_ISSUER=\"https://login.microsoftonline.com/$TENANT_ID/v2.0\""
echo ""
echo "================================================"
echo "⚠️  IMPORTANT: Save the client secret now!"
echo "   You won't be able to see it again."
echo "================================================"
echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Copy the environment variables above to .env.local"
echo "2. Set OWNER_EMAIL in .env.local to your email"
echo "3. Generate NEXTAUTH_SECRET: openssl rand -base64 32"
echo "4. Update REDIRECT_URI_PROD in this script when you have your Vercel URL"
