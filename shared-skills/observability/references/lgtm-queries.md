# LGTM Queries (Second-Attempt)

## Cluster Coordinates
- Namespace: `nc`
- Grafana UI: `https://aa3cf11daa553482aac6aa272a7b9d4e-1077346153.us-east-1.elb.amazonaws.com/monitoring`
- Loki service: `http://nebari-loki-stack:3100`
- Prometheus service: `http://nebari-kube-prometheus-sta-prometheus:9090`

## Health
```bash
curl -fsS http://nebari-loki-stack:3100/ready
curl -fsS http://nebari-kube-prometheus-sta-prometheus:9090/-/ready
```

## Loki
```bash
curl -fsS "http://nebari-loki-stack:3100/loki/api/v1/labels" | jq
curl -fsS "http://nebari-loki-stack:3100/loki/api/v1/label/job/values" | jq
curl -fsS --get "http://nebari-loki-stack:3100/loki/api/v1/query" \
  --data-urlencode 'query={namespace="nc"} |= "error"' | jq
```

## Prometheus
```bash
curl -fsS "http://nebari-kube-prometheus-sta-prometheus:9090/api/v1/query?query=up" | jq
curl -fsS --get "http://nebari-kube-prometheus-sta-prometheus:9090/api/v1/query" \
  --data-urlencode 'query=sum(rate(container_cpu_usage_seconds_total{namespace="nc"}[5m]))' | jq
curl -fsS --get "http://nebari-kube-prometheus-sta-prometheus:9090/api/v1/query" \
  --data-urlencode 'query=sum(container_memory_working_set_bytes{namespace="nc"}) by (pod)' | jq
```

## Kubernetes Inspection
```bash
kubectl -n nc get ingressroute
kubectl -n nc get pods | grep -E "grafana|loki|prometheus"
kubectl -n nc logs nebari-loki-stack-0 --tail=200
```
