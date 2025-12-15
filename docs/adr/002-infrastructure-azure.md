# ADR 002: Infrastructure - Azure Container Apps

## Status
Accepted

## Context
We need to deploy the Rate Your Day application to Azure. The available options are:
1. **Azure Kubernetes Service (AKS)** - Existing K8s cluster
2. **Azure Container Apps** - Serverless containers
3. **Azure Static Web Apps** - Static hosting with serverless functions
4. **Azure App Service** - Traditional PaaS

## Decision
We will use **Azure Container Apps** for deployment.

## Rationale

### Why Container Apps over AKS

| Factor | Container Apps | AKS |
|--------|----------------|-----|
| Operational overhead | Minimal | High |
| Scaling | Automatic | Manual config |
| Cost model | Pay per use | Always-on cluster |
| Complexity | Simple | Complex |
| Learning curve | Low | High |

For a simple mood tracking app, AKS is overkill. Container Apps provides:
- Automatic scaling (including scale to zero)
- Built-in HTTPS and ingress
- Simple CI/CD integration
- No cluster management

### Why Container Apps over Static Web Apps

Static Web Apps would work for a purely static frontend, but:
- We need server-side database access
- API routes benefit from container flexibility
- Easier to add background jobs later if needed

### Architecture

```
┌─────────────────────────────────────────────────┐
│                    Azure                         │
│  ┌───────────────────────────────────────────┐  │
│  │         Container Apps Environment         │  │
│  │  ┌─────────────────────────────────────┐  │  │
│  │  │     rate-your-day Container App     │  │  │
│  │  │     (Next.js application)           │  │  │
│  │  │     - Auto-scales 0-10 instances    │  │  │
│  │  │     - HTTPS ingress                 │  │  │
│  │  └─────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────┘  │
│                       │                          │
│                       ▼                          │
│  ┌───────────────────────────────────────────┐  │
│  │     Azure Database for PostgreSQL         │  │
│  │     (Flexible Server - Burstable)         │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Cost Estimate (Low Traffic)

| Resource | Estimated Monthly Cost |
|----------|----------------------|
| Container Apps (scale to zero) | $0-10 |
| PostgreSQL Flexible (B1ms) | ~$15 |
| **Total** | **~$15-25/month** |

## Consequences

### Positive
- Zero infrastructure management
- Cost-effective for low traffic
- Simple deployment via GitHub Actions
- Automatic HTTPS certificates
- Easy environment management (staging/prod)

### Negative
- Less control than AKS
- Cold start latency when scaled to zero
- Vendor lock-in to Azure Container Apps

### Mitigations
- Cold starts: Configure minimum replicas=1 if latency is critical
- Vendor lock-in: Dockerfile-based deployment is portable

## Implementation Notes

### Deployment Pipeline
```yaml
# .github/workflows/deploy.yml (simplified)
- Build Docker image
- Push to Azure Container Registry
- Deploy to Container Apps via az containerapp up
```

### Environment Configuration
- Development: SQLite local database
- Staging: Container Apps + PostgreSQL (shared)
- Production: Container Apps + PostgreSQL (dedicated)

## Future Considerations

If the app grows significantly:
- Consider AKS migration for cost optimization at scale
- Add Azure CDN for static assets
- Implement Azure Front Door for global distribution

## References
- [Azure Container Apps Overview](https://learn.microsoft.com/en-us/azure/container-apps/overview)
- [Container Apps Pricing](https://azure.microsoft.com/en-us/pricing/details/container-apps/)
