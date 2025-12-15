#!/bin/bash

# Script to create Azure Cosmos DB account for Rate Your Day
# Requirements: Azure CLI installed and logged in (az login)

set -e

RESOURCE_GROUP="rate-your-day-rg"
ACCOUNT_NAME="cosmos-rate-your-day"
LOCATION="eastus"  # Change if you prefer a different region
API_KIND="MongoDB"
SERVER_VERSION="4.2"

echo "🚀 Creating Azure Cosmos DB Account"
echo ""
echo "Configuration:"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Account Name: $ACCOUNT_NAME"
echo "  Location: $LOCATION"
echo "  API: $API_KIND"
echo "  Capacity: Serverless"
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
echo "📋 Using subscription: $SUBSCRIPTION"
echo ""

# Create resource group
echo "📦 Creating resource group..."
az group create \
    --name "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --output none

echo "✅ Resource group created: $RESOURCE_GROUP"

# Create Cosmos DB account with MongoDB API (Serverless)
echo "🗄️  Creating Cosmos DB account (this may take 3-5 minutes)..."
az cosmosdb create \
    --name "$ACCOUNT_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --kind MongoDB \
    --server-version "$SERVER_VERSION" \
    --capabilities EnableServerless \
    --locations regionName="$LOCATION" \
    --enable-automatic-failover false \
    --output none

echo "✅ Cosmos DB account created: $ACCOUNT_NAME"

# Get connection string
echo "🔐 Retrieving connection string..."
CONNECTION_STRING=$(az cosmosdb keys list \
    --name "$ACCOUNT_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --type connection-strings \
    --query "connectionStrings[0].connectionString" \
    --output tsv)

# Extract host from connection string
HOST=$(echo "$CONNECTION_STRING" | sed -n 's/.*@\([^/]*\).*/\1/p')

# Create databases (they'll be created automatically when Prisma pushes schema)
echo "📝 Database setup ready"
echo ""

# Output connection strings
echo "================================================"
echo "📝 Add these to your environment files:"
echo "================================================"
echo ""
echo "### Development (.env.local) ###"
echo "DATABASE_URL=\"mongodb://${ACCOUNT_NAME}:$(az cosmosdb keys list --name "$ACCOUNT_NAME" --resource-group "$RESOURCE_GROUP" --query "primaryMasterKey" -o tsv)@${HOST}:10255/rate-your-day-dev?ssl=true&retryWrites=false&retrywrites=false&maxIdleTimeMS=120000\""
echo ""
echo "### Production (Vercel) ###"
echo "DATABASE_URL=\"mongodb://${ACCOUNT_NAME}:$(az cosmosdb keys list --name "$ACCOUNT_NAME" --resource-group "$RESOURCE_GROUP" --query "primaryMasterKey" -o tsv)@${HOST}:10255/rate-your-day-prod?ssl=true&retryWrites=false&retrywrites=false&maxIdleTimeMS=120000\""
echo ""
echo "================================================"
echo "⚠️  IMPORTANT: Save these connection strings!"
echo "   You won't be able to see the keys again easily."
echo "================================================"
echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Copy the Development DATABASE_URL to .env.local"
echo "2. Run: bunx prisma db push"
echo "3. Run: bunx prisma generate"
echo "4. Test your connection"
echo ""
echo "Cost estimate:"
echo "- Free tier: 1000 RU/s, 25 GB storage"
echo "- Your usage: <100 RU/s for single user"
echo "- Expected cost: \$0/month (within free tier)"
