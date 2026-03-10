---
name: observability
description: Use when Pi needs to verify or troubleshoot Nebari observability (Grafana/Loki/Prometheus) across local k3s or cloud deployments. Trigger for requests like "is monitoring up?", "check logs", "query metrics", or "debug monitoring access".
---

# Observability (Generic Nebari Deployment)

Use this workflow for **any** Nebari environment (local k3s, cloud, different hostnames/namespaces).

## Goals
1. Confirm Grafana is reachable.
2. Discover the correct Loki + Prometheus endpoints for the current cluster.
3. Run minimal health + query checks.
4. Report results with exact commands and next actions.

## 0) Inputs to gather first
- Current app/base URL (if known), e.g. `https://<host>`
- Whether `kubectl` is available from current runtime
- Current namespace context (if known)

If base URL is known, set:
```bash
export PUBLIC_BASE_URL="https://<your-host>"
export GRAFANA_URL="${PUBLIC_BASE_URL%/}/monitoring"
```

## 1) Quick external check (Grafana)
```bash
curl -k -fsS "${GRAFANA_URL}/api/health" | jq
```
Expected: JSON with `database: "ok"` (or equivalent healthy response).

If this fails, report exact HTTP/code and move to Kubernetes-side routing checks.

## 2) Discover Loki + Prometheus services (do not hardcode names)

### Preferred (with kubectl)
```bash
kubectl get svc -A | grep -Ei 'loki|prometheus|grafana'
```
Pick namespace/service pairs from output and use fully-qualified in-cluster DNS:
- `http://<svc>.<ns>.svc.cluster.local:<port>`

Common ports:
- Loki: `3100`
- Prometheus: `9090`

Set endpoints:
```bash
export LOKI_URL="http://<loki-svc>.<ns>.svc.cluster.local:3100"
export PROM_URL="http://<prom-svc>.<ns>.svc.cluster.local:9090"
```

### If kubectl is unavailable
Try candidate FQDNs and keep the first that responds:
```bash
for ns in monitoring observability nc; do
  for svc in loki loki-gateway nebari-loki-stack; do
    url="http://${svc}.${ns}.svc.cluster.local:3100/ready"
    echo "checking $url"
    curl -fsS "$url" && echo "LOKI OK: $url" && break 2
  done
done

for ns in monitoring observability nc; do
  for svc in prometheus kube-prometheus-stack-prometheus nebari-kube-prometheus-sta-prometheus; do
    url="http://${svc}.${ns}.svc.cluster.local:9090/-/ready"
    echo "checking $url"
    curl -fsS "$url" && echo "PROM OK: $url" && break 2
  done
done
```

## 3) Health checks
```bash
curl -fsS "${LOKI_URL}/ready"
curl -fsS "${PROM_URL}/-/ready"
```

## 4) Minimal queries
```bash
curl -fsS "${LOKI_URL}/loki/api/v1/labels" | jq
curl -fsS "${PROM_URL}/api/v1/query?query=up" | jq
```

## 5) If service DNS fails from Pi runtime
If you see `Could not resolve host` or connection failures:
1. Ensure you are using namespace-qualified DNS (`<svc>.<ns>.svc.cluster.local`).
2. Verify services actually exist in that namespace.
3. Check network policies/egress from user pods to monitoring namespace and kube-dns.
4. Use Grafana route (`/monitoring`) as fallback path for UI-level verification.

## 6) Kubernetes-side diagnostics (when kubectl is available)
```bash
kubectl get pods -A | grep -Ei 'loki|prometheus|grafana'
kubectl get svc -A | grep -Ei 'loki|prometheus|grafana'
kubectl get httproute -A | grep -Ei 'grafana|monitoring'
kubectl get ingress -A | grep -Ei 'grafana|monitoring'
```

## Reporting format
Always include:
1. Exact command run.
2. Status (`ok` / `failed`) and key fields (HTTP code/error snippet).
3. Resolved endpoints used (`GRAFANA_URL`, `LOKI_URL`, `PROM_URL`).
4. Next action that isolates root cause.

## Reference
- See `references/lgtm-queries.md` for reusable generic query snippets.
