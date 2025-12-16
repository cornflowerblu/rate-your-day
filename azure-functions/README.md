# Azure Functions - Rate Your Day

This directory contains Azure Functions for the Rate Your Day application.

## Functions

### Daily Reminder (`daily-reminder/`)

Timer Trigger function that sends push notifications at 9 PM CST to users who haven't rated their day.

See [daily-reminder/README.md](./daily-reminder/README.md) for detailed documentation.

## Quick Start

### Prerequisites

- Node.js 20.9.0+
- Azure Functions Core Tools v4: `npm install -g azure-functions-core-tools@4`
- Azure CLI (for deployment): `az --version`

### Local Development

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Configure environment**:

   ```bash
   cp local.settings.json.example local.settings.json
   # Edit local.settings.json with your credentials
   ```

3. **Generate VAPID keys** (if you don't have them):

   ```bash
   npx web-push generate-vapid-keys
   # Copy the keys to local.settings.json and .env.local in main app
   ```

4. **Generate Prisma client**:

   ```bash
   cd ..
   npx prisma generate
   cd azure-functions
   ```

5. **Build TypeScript**:

   ```bash
   npm run build
   ```

6. **Start functions locally**:
   ```bash
   npm start
   ```

### Testing Locally

The timer trigger runs on its schedule (3 AM UTC). For testing:

1. **Modify schedule temporarily**:
   Edit `daily-reminder/function.json`:

   ```json
   "schedule": "0 */5 * * * *"  // Every 5 minutes
   ```

2. **Run function**:

   ```bash
   npm start
   ```

3. **Restore schedule** when done

### Deployment

1. **Login to Azure**:

   ```bash
   az login
   ```

2. **Create resources** (first time only):

   ```bash
   # Create resource group
   az group create --name rate-your-day-rg --location centralus

   # Create storage account (required for Functions)
   az storage account create \
     --name rateyourdaystorage \
     --location centralus \
     --resource-group rate-your-day-rg \
     --sku Standard_LRS

   # Create Function App
   az functionapp create \
     --resource-group rate-your-day-rg \
     --consumption-plan-location centralus \
     --runtime node \
     --runtime-version 20 \
     --functions-version 4 \
     --name func-rate-your-day-reminder \
     --storage-account rateyourdaystorage
   ```

3. **Configure environment variables** in Azure Portal:
   - Navigate to Function App > Configuration > Application Settings
   - Add:
     - `DATABASE_URL`
     - `VAPID_PUBLIC_KEY`
     - `VAPID_PRIVATE_KEY`
     - `VAPID_SUBJECT`

4. **Deploy**:

   ```bash
   func azure functionapp publish func-rate-your-day-reminder
   ```

5. **Verify**:
   - Check Function App > Functions > daily-reminder > Monitor
   - View logs in Application Insights

## Project Structure

```
azure-functions/
├── daily-reminder/          # Timer trigger for 9 PM reminders
│   ├── function.json       # Function binding configuration
│   ├── index.ts            # Function implementation
│   └── README.md           # Detailed documentation
├── host.json               # Function app configuration
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript configuration
├── local.settings.json.example  # Environment template
└── README.md               # This file
```

## Environment Variables

All functions require these environment variables:

| Variable            | Description                         | Example                                 |
| ------------------- | ----------------------------------- | --------------------------------------- |
| `DATABASE_URL`      | Cosmos DB MongoDB connection string | `mongodb+srv://...`                     |
| `VAPID_PUBLIC_KEY`  | Public VAPID key for web-push       | From `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | Private VAPID key for web-push      | From `npx web-push generate-vapid-keys` |
| `VAPID_SUBJECT`     | Contact info for VAPID              | `mailto:your-email@example.com`         |

### Generating VAPID Keys

VAPID keys are required for Web Push API:

```bash
npx web-push generate-vapid-keys
```

Output:

```
=======================================
Public Key:
BEl62i...

Private Key:
bdSiCo...
=======================================
```

Add these to:

- **Azure Function App Settings**: Both keys
- **Main App `.env.local`**: Public key as `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, private key as `VAPID_PRIVATE_KEY`
- **Azure Functions `local.settings.json`**: Both keys for local testing

## Monitoring

### Local Development

Function logs appear in the terminal:

```bash
[2025-12-16T03:00:00.000Z] Executing 'Functions.daily-reminder'
[2025-12-16T03:00:00.123Z] Daily reminder function triggered at: 2025-12-16T03:00:00.123Z
[2025-12-16T03:00:00.456Z] Checking for unrated days on date: 2025-12-15
[2025-12-16T03:00:01.234Z] Found 1 push subscription(s)
[2025-12-16T03:00:02.345Z] Successfully sent notification to user@example.com
[2025-12-16T03:00:02.567Z] Daily reminder execution complete
[2025-12-16T03:00:02.567Z] Notifications sent: 1
```

### Production (Azure Portal)

1. **Function App > Functions > daily-reminder > Monitor**:
   - View invocation history
   - Success/failure rates
   - Execution duration

2. **Application Insights > Logs**:
   - Query custom metrics
   - Set up alerts
   - View detailed traces

## Cost Estimation

**Consumption Plan** (Pay-per-execution):

- 1 execution per day = 30 executions/month
- Duration: 2-5 seconds per execution
- Memory: ~128 MB

**Free Tier**: 1,000,000 executions/month, 400,000 GB-s/month

**Estimated Cost**: **$0/month** (well within free tier)

## Troubleshooting

### Build Errors

```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Prisma Client Errors

```bash
# Regenerate Prisma client
cd ..
npx prisma generate
cd azure-functions
npm run build
```

### Local Function Not Running

1. Check Azure Functions Core Tools version: `func --version` (should be 4.x)
2. Verify Node.js version: `node --version` (should be 20.9.0+)
3. Check `local.settings.json` exists and has valid values

### Deployment Errors

1. Verify Azure CLI login: `az account show`
2. Check Function App exists: `az functionapp list`
3. Ensure environment variables are configured in Azure Portal

## Development Tips

### Hot Reload

TypeScript watch mode for development:

```bash
npm run watch
# In another terminal:
npm start
```

### Debug Mode

Add breakpoints in VS Code:

1. Create `.vscode/launch.json`:

   ```json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "name": "Attach to Node Functions",
         "type": "node",
         "request": "attach",
         "port": 9229,
         "preLaunchTask": "func: host start"
       }
     ]
   }
   ```

2. Run: `func start --inspect`
3. Press F5 in VS Code

### Testing Push Notifications

To test without waiting for the timer:

1. Create a test HTTP endpoint temporarily:

   ```typescript
   // In index.ts
   export async function httpTrigger(context: Context, req: HttpRequest) {
     return timerTrigger(context, {})
   }
   ```

2. Add HTTP binding to `function.json`:

   ```json
   {
     "type": "httpTrigger",
     "direction": "in",
     "name": "req",
     "methods": ["post"]
   }
   ```

3. Trigger via HTTP:
   ```bash
   curl -X POST http://localhost:7071/api/daily-reminder
   ```

## Security Best Practices

- Never commit `local.settings.json` (included in `.gitignore`)
- Store secrets in Azure Key Vault (for production)
- Use managed identities for Azure resource access
- Rotate VAPID keys if compromised
- Monitor function logs for suspicious activity

## Additional Resources

- [Azure Functions Documentation](https://docs.microsoft.com/en-us/azure/azure-functions/)
- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [VAPID Specification](https://tools.ietf.org/html/rfc8292)
- [Prisma with Azure Functions](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-azure-functions)
