# ADR 002: Infrastructure - Azure Deployment Strategy

## Status
**Pending Investigation** - Awaiting AKS cluster resource evaluation

## Context
We need to deploy the Rate Your Day application to Azure. The available options are:
1. **Azure Kubernetes Service (AKS)** - Existing cluster with full GitOps setup
2. **Azure Container Apps** - Serverless containers (fallback option)
3. **Azure Static Web Apps** - Static hosting with serverless functions
4. **Azure App Service** - Traditional PaaS

## Decision
**Pending** - Evaluate existing AKS cluster viability first. See `docs/investigations/aks-cluster-evaluation.md`.

If AKS has sufficient resources → Use existing AKS cluster
If AKS is resource-constrained → Use Azure Container Apps

## Option A: Existing AKS Cluster (Preferred)

### Available Infrastructure
The existing AKS cluster already has:
- **Kustomize** - Configuration management
- **Istio** - Service mesh (traffic management, mTLS, observability)
- **Flux** - GitOps continuous delivery
- **Sealed Secrets** - Encrypted secrets safe to store in Git
- **DNS** - Already configured

### Advantages of Using Existing AKS

| Factor | Benefit |
|--------|---------|
| Infrastructure cost | Already paid for (sunk cost) |
| DNS/Ingress | Already configured with Istio |
| GitOps | Flux already set up for deployments |
| Secrets management | Sealed Secrets for GitOps-safe secrets |
| Observability | Istio provides metrics, tracing |
| Security | mTLS between services via Istio |
| Team familiarity | Existing operational knowledge |

### Architecture (AKS)

```
┌─────────────────────────────────────────────────────────────┐
│                    Existing AKS Cluster                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                 Istio Service Mesh                     │  │
│  │  ┌─────────────────┐    ┌─────────────────────────┐   │  │
│  │  │ Istio Ingress   │───▶│  rate-your-day          │   │  │
│  │  │ Gateway         │    │  (Deployment + Service) │   │  │
│  │  │ (DNS configured)│    │  - Next.js 16 container │   │  │
│  │  └─────────────────┘    └─────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────┘  │
│                              │                               │
│  ┌───────────────────────────▼───────────────────────────┐  │
│  │                    Flux GitOps                         │  │
│  │  Watches: github.com/*/rate-your-day/k8s/             │  │
│  │  Applies: Kustomize overlays per environment          │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│            Azure Database for PostgreSQL                     │
└─────────────────────────────────────────────────────────────┘
```

### Required K8s Manifests

```
k8s/
├── base/
│   ├── kustomization.yaml
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── configmap.yaml
│   └── istio-virtualservice.yaml
└── overlays/
    ├── dev/
    │   ├── kustomization.yaml
    │   └── sealedsecret.yaml    # Encrypted secrets for dev
    └── prod/
        ├── kustomization.yaml
        └── sealedsecret.yaml    # Encrypted secrets for prod
```

### Secrets Management with Sealed Secrets
Sensitive values (DATABASE_URL, AZURE_AD_CLIENT_SECRET, VAPID keys, etc.) are encrypted using `kubeseal` and stored safely in Git:

```bash
# Encrypt a secret for the cluster
kubeseal --format yaml < secret.yaml > sealedsecret.yaml
```

Only the cluster's Sealed Secrets controller can decrypt these values.

### Known Concerns
- **Resource constraints** reported on the cluster
- Need to verify available CPU/memory
- May need to scale node pool or evict unused workloads

## Option B: Azure Container Apps (Fallback)

### When to Choose This Option
- AKS cluster cannot accommodate the workload
- Cluster resource issues cannot be resolved quickly
- Simpler deployment is preferred over leveraging existing infra

### Comparison

| Factor | AKS (Existing) | Container Apps |
|--------|----------------|----------------|
| Incremental cost | ~$0 (existing) | ~$15-25/month |
| Setup effort | Medium (manifests) | Low |
| DNS setup | Done | New setup needed |
| GitOps | Flux ready | GitHub Actions |
| Secrets | Sealed Secrets (Git-safe) | Azure Key Vault refs |
| Service mesh | Istio included | Not available |
| Operational overhead | Shared with cluster | Minimal |

### Architecture (Container Apps)

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

## Next Steps

1. **Investigate AKS cluster** - See `docs/investigations/aks-cluster-evaluation.md`
2. **Decision point** - Choose AKS or Container Apps based on findings
3. **Implementation** - Create deployment manifests for chosen platform

## References
- [Azure Container Apps Overview](https://learn.microsoft.com/en-us/azure/container-apps/overview)
- [Flux GitOps](https://fluxcd.io/docs/)
- [Istio on AKS](https://learn.microsoft.com/en-us/azure/aks/istio-about)
- [Kustomize](https://kustomize.io/)
- [Sealed Secrets](https://sealed-secrets.netlify.app/)
