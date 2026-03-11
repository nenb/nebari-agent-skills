# LGTM Queries & Access Patterns (Local/Cloud/Generic Kubernetes)

Use this as a toolbox after endpoint discovery.

---

## 1) Discover services

```bash
kubectl get svc -A | grep -Ei 'grafana|loki|mimir|tempo|prometheus|otel'
```

Typical Nebari LGTM (if installed as `lgtm-pack` in `monitoring`):
- Grafana: `http://lgtm-pack-grafana.monitoring.svc.cluster.local:80`
- Loki: `http://lgtm-pack-loki.monitoring.svc.cluster.local:3100`
- Mimir: `http://lgtm-pack-mimir-gateway.monitoring.svc.cluster.local`
- Tempo: `http://lgtm-pack-tempo.monitoring.svc.cluster.local:3200`

Set:
```bash
export GRAFANA_SVC="http://<grafana-svc>.<ns>.svc.cluster.local:80"
export LOKI_URL="http://<loki-svc>.<ns>.svc.cluster.local:3100"
export MIMIR_URL="http://<mimir-gateway-svc>.<ns>.svc.cluster.local"
export TEMPO_URL="http://<tempo-svc>.<ns>.svc.cluster.local:3200"
export PROM_URL="http://<prometheus-svc>.<ns>.svc.cluster.local:9090"
```

---

## 2) Health checks

```bash
curl -fsS "${GRAFANA_SVC}/login" >/dev/null && echo grafana_ok
curl -fsS "${LOKI_URL}/ready"
curl -fsS "${MIMIR_URL}/ready"
curl -fsS "${PROM_URL}/-/ready"
```

---

## 3) Loki logs (most common)

### Available labels
```bash
curl -fsS "${LOKI_URL}/loki/api/v1/labels"
```

### Namespace logs
```bash
curl -sG "${LOKI_URL}/loki/api/v1/query_range" \
  --data-urlencode 'query={namespace="data-science"}' \
  --data-urlencode 'limit=200' \
  --data-urlencode 'direction=BACKWARD'
```

### Pod logs
```bash
curl -sG "${LOKI_URL}/loki/api/v1/query_range" \
  --data-urlencode 'query={namespace="data-science",pod=~"hub-.*"}' \
  --data-urlencode 'limit=200' \
  --data-urlencode 'direction=BACKWARD'
```

### Error-focused
```bash
curl -sG "${LOKI_URL}/loki/api/v1/query_range" \
  --data-urlencode 'query={namespace="data-science"} |= "error"' \
  --data-urlencode 'limit=200' \
  --data-urlencode 'direction=BACKWARD'
```

### Broad cluster logs (full-access mode)
```bash
curl -sG "${LOKI_URL}/loki/api/v1/query_range" \
  --data-urlencode 'query={job=~".+"}' \
  --data-urlencode 'limit=200' \
  --data-urlencode 'direction=BACKWARD'
```

---

## 4) Prometheus/Mimir queries

### Basic up
```bash
curl -sG "${PROM_URL}/api/v1/query" \
  --data-urlencode 'query=up'
```

### CPU by namespace
```bash
curl -sG "${PROM_URL}/api/v1/query" \
  --data-urlencode 'query=sum(rate(container_cpu_usage_seconds_total{namespace="data-science"}[5m]))'
```

### Memory by pod
```bash
curl -sG "${PROM_URL}/api/v1/query" \
  --data-urlencode 'query=sum(container_memory_working_set_bytes{namespace="data-science"}) by (pod)'
```

---

## 5) pi-debug path (if installed in Pi image)

```bash
pi-debug logs --app pi --since 30m
pi-debug events --app pi
pi-debug rollout --app pi
pi-debug doctor --app pi
```

If these fail, test proxy directly (if reachable):
```bash
curl -fsS "http://pi-observability-proxy.data-science.svc.cluster.local:8085/healthz"
```

---

## 6) Port-forward quick access

### Grafana UI
```bash
kubectl -n monitoring port-forward svc/lgtm-pack-grafana 3000:80
# open http://localhost:3000/login
```

### JupyterHub/Pi route
```bash
kubectl -n data-science port-forward svc/proxy-public 8000:80
# open http://localhost:8000/hub/login?next=%2Fservices%2Fpi-launcher%2F
```

---

## 7) Cloud/public-route checks

```bash
export GRAFANA_URL="https://<host>/monitoring"
curl -k -fsS "${GRAFANA_URL}/api/health"
```

If public fails but service DNS works, the issue is likely gateway/ingress/auth routing, not LGTM internals.

---

## 8) Quick failure interpretation

- `Could not resolve host`:
  - bad service name or missing namespace in DNS.
- `Connection refused`:
  - wrong port or backend pod not listening/ready.
- `403/401`:
  - auth/tenant enforcement or gateway policy.
- `timeout`:
  - network policy, DNS, or service endpoint issues.
