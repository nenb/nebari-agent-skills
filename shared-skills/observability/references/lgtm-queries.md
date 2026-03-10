# LGTM Queries (Generic Nebari)

Use this reference after discovering your endpoints.

## 1) Set endpoints
```bash
# External Grafana route (via Nebari app/gateway)
export GRAFANA_URL="https://<your-host>/monitoring"

# In-cluster data sources (use discovered svc + namespace)
export LOKI_URL="http://<loki-svc>.<monitoring-ns>.svc.cluster.local:3100"
export PROM_URL="http://<prom-svc>.<monitoring-ns>.svc.cluster.local:9090"
```

## 2) Health
```bash
curl -k -fsS "${GRAFANA_URL}/api/health" | jq
curl -fsS "${LOKI_URL}/ready"
curl -fsS "${PROM_URL}/-/ready"
```

## 3) Loki quick checks
```bash
curl -fsS "${LOKI_URL}/loki/api/v1/labels" | jq
curl -fsS "${LOKI_URL}/loki/api/v1/label/job/values" | jq

# Namespace-scoped error search (replace <ns>)
curl -fsS --get "${LOKI_URL}/loki/api/v1/query" \
  --data-urlencode 'query={namespace="<ns>"} |= "error"' | jq
```

## 4) Prometheus quick checks
```bash
curl -fsS --get "${PROM_URL}/api/v1/query" \
  --data-urlencode 'query=up' | jq

# CPU by namespace (replace <ns>)
curl -fsS --get "${PROM_URL}/api/v1/query" \
  --data-urlencode 'query=sum(rate(container_cpu_usage_seconds_total{namespace="<ns>"}[5m]))' | jq

# Memory by pod (replace <ns>)
curl -fsS --get "${PROM_URL}/api/v1/query" \
  --data-urlencode 'query=sum(container_memory_working_set_bytes{namespace="<ns>"}) by (pod)' | jq
```

## 5) Service discovery helpers
```bash
kubectl get svc -A | grep -Ei 'loki|prometheus|grafana'
kubectl get pods -A | grep -Ei 'loki|prometheus|grafana'
```

## 6) Common failure interpretation
- `Could not resolve host`:
  - wrong service name or missing namespace in URL
  - use `<svc>.<ns>.svc.cluster.local`
- `Connection refused`:
  - wrong port/service target or pod not ready
- Grafana `/monitoring` works but Loki/Prometheus fail:
  - direct in-cluster path not reachable from runtime; verify NetworkPolicy/egress and DNS
