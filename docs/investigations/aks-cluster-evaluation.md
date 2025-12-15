# Investigation: AKS Cluster Evaluation for rate-your-day

## Status
**Not Started**

## Objective
Determine the Level of Effort (LOE) to deploy rate-your-day to the existing AKS cluster, considering reported resource constraints.

## Background
An existing AKS cluster is available with:
- Kustomize configuration management
- Istio service mesh
- Flux GitOps deployments
- Sealed Secrets for encrypted secrets in Git
- DNS already configured

However, the cluster has been experiencing **resource issues** that need evaluation.

## Investigation Tasks

### 1. Cluster Resource Assessment
- [ ] Connect to cluster: `az aks get-credentials --resource-group <rg> --name <cluster>`
- [ ] Check node capacity: `kubectl describe nodes`
- [ ] Check current resource usage: `kubectl top nodes`
- [ ] Check pod resource usage: `kubectl top pods --all-namespaces`
- [ ] Identify resource requests/limits: `kubectl get pods --all-namespaces -o jsonpath='{range .items[*]}{.metadata.namespace}{"\t"}{.metadata.name}{"\t"}{.spec.containers[*].resources}{"\n"}{end}'`

### 2. Available Capacity Analysis
- [ ] Calculate total allocatable CPU/memory
- [ ] Calculate current usage
- [ ] Determine headroom for new workloads
- [ ] Identify any pods in Pending state due to resources

### 3. rate-your-day Resource Requirements
Estimated requirements for Next.js 16 app:

| Resource | Request | Limit |
|----------|---------|-------|
| CPU | 100m | 500m |
| Memory | 128Mi | 512Mi |
| Replicas | 1-3 | 3 |

**Total needed**: ~300m-1500m CPU, 384Mi-1536Mi memory

### 4. Istio/Flux/Sealed Secrets Health Check
- [ ] Verify Istio control plane is healthy: `istioctl analyze`
- [ ] Check Flux status: `flux check`
- [ ] Verify existing GitOps repos are syncing
- [ ] Check Istio ingress gateway is functional
- [ ] Verify Sealed Secrets controller is running: `kubectl get pods -n kube-system -l name=sealed-secrets-controller`

### 5. Options if Resources Constrained

| Option | Effort | Cost Impact |
|--------|--------|-------------|
| Scale node pool | Low | +$X/month |
| Remove unused workloads | Medium | $0 |
| Use smaller VM SKU | Medium | Variable |
| Switch to Container Apps | Medium | +$15-25/month |
| Enable cluster autoscaler | Low | Variable |

## Commands Reference

```bash
# Get cluster credentials
az aks get-credentials --resource-group <RESOURCE_GROUP> --name <CLUSTER_NAME>

# Node resources
kubectl describe nodes | grep -A 5 "Allocated resources"
kubectl top nodes

# Pod resources
kubectl top pods -A --sort-by=memory
kubectl top pods -A --sort-by=cpu

# Pending pods (resource issues)
kubectl get pods -A --field-selector=status.phase=Pending

# Istio health
istioctl analyze
kubectl get pods -n istio-system

# Flux health
flux check
flux get all -A

# Sealed Secrets health
kubectl get pods -n kube-system -l name=sealed-secrets-controller
kubeseal --version

# Resource quotas
kubectl get resourcequotas -A
```

## Findings

### Cluster Capacity
| Metric | Value | Notes |
|--------|-------|-------|
| Total nodes | TBD | |
| Node SKU | TBD | |
| Total CPU | TBD | |
| Total Memory | TBD | |
| Used CPU | TBD | |
| Used Memory | TBD | |
| Available CPU | TBD | |
| Available Memory | TBD | |

### Istio Status
- Control plane: TBD
- Ingress gateway: TBD
- Certificate status: TBD

### Flux Status
- Source controller: TBD
- Kustomize controller: TBD
- Existing repos: TBD

### Sealed Secrets Status
- Controller running: TBD
- kubeseal version: TBD

## Recommendation
**Pending investigation completion**

## LOE Estimate

### If AKS is viable:
| Task | Estimate |
|------|----------|
| Write Kustomize base manifests | 2-4 hours |
| Create dev/prod overlays | 1-2 hours |
| Create Sealed Secrets for env vars | 1 hour |
| Configure Istio VirtualService | 1 hour |
| Set up Flux GitRepository + Kustomization | 1-2 hours |
| Testing and validation | 2-4 hours |
| **Total** | **8-14 hours** |

### If AKS needs fixes first:
| Task | Estimate |
|------|----------|
| Scale node pool | 30 min |
| OR Remove unused workloads | 2-4 hours |
| OR Enable autoscaler | 1 hour |
| + Base deployment work | 8-14 hours |
| **Total** | **9-18 hours** |

### If switching to Container Apps:
| Task | Estimate |
|------|----------|
| Create Container App | 1 hour |
| Configure ingress/DNS | 1-2 hours |
| Set up GitHub Actions | 2-3 hours |
| Testing and validation | 2-4 hours |
| **Total** | **6-10 hours** |

## Decision Criteria

Choose **AKS** if:
- Available resources >= 500m CPU, 512Mi memory headroom
- Istio and Flux are healthy
- Team wants to leverage existing GitOps workflow

Choose **Container Apps** if:
- Cluster is severely resource-constrained
- Fixing cluster issues would take > 4 hours
- Simpler deployment is preferred

## Next Steps
1. Schedule time to connect to cluster and gather data
2. Fill in "Findings" section above
3. Make go/no-go recommendation
4. Update ADR 002 with decision
