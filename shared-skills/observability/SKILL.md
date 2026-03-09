---
name: observability
description: Use when Pi needs to verify or troubleshoot observability on the second-attempt Nebari deployment, including Grafana at /monitoring, Loki log queries, and Prometheus health/metrics. Trigger this skill for requests like "is monitoring up?", "check logs for X", "query metrics", or "debug monitoring access issues."
---

# Observability (Second-Attempt Cluster)

Run this workflow on the no-conda deployment at:
- External base URL: `https://aa3cf11daa553482aac6aa272a7b9d4e-1077346153.us-east-1.elb.amazonaws.com`
- Namespace: `nc`

## Quick Health Sequence
1. Check Grafana ingress from a browser:
- Open `/monitoring` from Hub.
- Confirm the page renders (not `503` or `Service Unavailable`).

2. Check Loki readiness from Pi terminal:
```bash
curl -fsS http://nebari-loki-stack:3100/ready
```

3. Check Prometheus readiness from Pi terminal:
```bash
curl -fsS http://nebari-kube-prometheus-sta-prometheus:9090/-/ready
```

4. Run a minimal log + metric query:
```bash
curl -fsS "http://nebari-loki-stack:3100/loki/api/v1/labels" | jq
curl -fsS "http://nebari-kube-prometheus-sta-prometheus:9090/api/v1/query?query=up" | jq
```

## Investigation Steps
1. If `/monitoring` fails, check ingress objects:
```bash
kubectl -n nc get ingressroute
kubectl -n nc get ingressroute grafana-ingress-route -o yaml
```

2. If Loki or Prometheus fails readiness, check pod status and recent logs:
```bash
kubectl -n nc get pods | grep -E "loki|prometheus|grafana"
kubectl -n nc logs nebari-loki-stack-0 --tail=200
kubectl -n nc logs prometheus-nebari-kube-prometheus-sta-prometheus-0 --tail=200
```

3. If queries return empty results, inspect available labels before narrowing selectors:
```bash
curl -fsS "http://nebari-loki-stack:3100/loki/api/v1/labels" | jq
curl -fsS "http://nebari-loki-stack:3100/loki/api/v1/label/job/values" | jq
```

## Reporting Format
When reporting results, include:
1. Exact command run.
2. Status (`ok` / `failed`) and key response fields.
3. Next action to isolate root cause.

## References
- Read `references/lgtm-queries.md` for copy-paste log and metric queries used in this cluster.
