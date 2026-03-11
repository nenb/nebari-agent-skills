---
name: jhub-deploy
description: Use when Pi needs to deploy, inspect, update, stop, or delete JupyterHub apps via nebari_app_* wrappers (jhub-apps/jhub-app-proxy), across local k3s or cloud Kubernetes.
---

# JHub Deploy Skill (Local k3s + Cloud Kubernetes)

This skill is **runtime-agnostic** (k3s/k3d, EKS/GKE/AKS, generic K8s) because it uses JupyterHub APIs via the `nebari_app_*` CLIs inside Pi images.

Use this skill for requests like:
- "deploy Streamlit/Panel/Gradio app"
- "check app startup logs"
- "stop/delete app"
- "why is app not reachable?"

---

## 1) Preconditions

Verify wrappers exist:
```bash
command -v nebari_app_deploy nebari_app_status nebari_app_logs nebari_app_stop nebari_app_delete nebari_app_doctor
```

These wrappers require Hub API env in runtime:
- `NEBARI_HUB_API_URL` or `JUPYTERHUB_API_URL`
- `NEBARI_HUB_API_TOKEN` or `JUPYTERHUB_API_TOKEN`
- user identity from `JUPYTERHUB_USER`/`NB_USER` (or inferred from service prefix)

If missing, report that the Pi image/runtime is not configured for jhub-app lifecycle commands.

---

## 2) Exact CLI surface (current)

## `nebari_app_deploy`
```bash
nebari_app_deploy \
  --name <app-name> \
  --framework <streamlit|panel|voila|gradio|jupyterlab|custom> \
  [--filepath <path>] \
  [--custom-command "<module cmd with {port}>"] \
  [--display-name <text>] \
  [--description <text>] \
  [--public] \
  [--keep-alive] \
  [--env-json '{"KEY":"value"}'] \
  [--conda-env <env>] \
  [--profile <profile>] \
  [--profile-image <image>] \
  [--share-users user1,user2] \
  [--share-groups group1,group2] \
  [--replace] \
  [--wait-seconds <n>] \
  [--user <hub-user>]
```

## `nebari_app_status`
```bash
nebari_app_status --name <app-name> [--json] [--user <hub-user>]
```

## `nebari_app_logs`
```bash
nebari_app_logs --name <app-name> [--lines <n>] [--user <hub-user>]
```

## `nebari_app_stop`
```bash
nebari_app_stop --name <app-name> [--wait-seconds <n>] [--user <hub-user>]
```

## `nebari_app_delete`
```bash
nebari_app_delete --name <app-name> [--wait-seconds <n>] [--user <hub-user>]
```

## `nebari_app_doctor`
```bash
nebari_app_doctor [--name <app-name>] [--json] [--no-log-probe] [--user <hub-user>]
```

Important safety behavior:
- Cross-user actions are blocked unless `NEBARI_APP_ALLOW_OTHER_USERS=1`.

---

## 3) Canonical deploy flows

## Streamlit
```bash
nebari_app_deploy \
  --name streamlit-demo \
  --framework streamlit \
  --filepath /home/ubuntu/apps/streamlit_app.py \
  --wait-seconds 20
```

## Panel
```bash
nebari_app_deploy \
  --name panel-demo \
  --framework panel \
  --filepath /home/ubuntu/apps/panel_app.py \
  --wait-seconds 20
```

## Gradio
```bash
nebari_app_deploy \
  --name gradio-demo \
  --framework gradio \
  --filepath /home/ubuntu/apps/gradio_app.py \
  --wait-seconds 20
```

## Custom
```bash
nebari_app_deploy \
  --name custom-demo \
  --framework custom \
  --filepath /home/ubuntu/apps \
  --custom-command "my_package.server {--}port={port}" \
  --wait-seconds 20
```

Custom mode rules:
- Must be module-style command (no `python`, no script path).
- Must include `{port}` placeholder.

---

## 4) Validation sequence after every deploy

Always run:
```bash
nebari_app_status --name <app-name>
nebari_app_logs --name <app-name>
```

If not healthy:
```bash
nebari_app_doctor --name <app-name>
```

Canonical URL pattern to report:
- `/user/<username>/<app-name>/`

---

## 5) Triage for failed/unreachable app

1. Wrapper-level checks:
```bash
nebari_app_status --name <app-name> --json
nebari_app_logs --name <app-name> --lines 300
nebari_app_doctor --name <app-name> --json
```

2. If `kubectl` is available, inspect Kubernetes side (namespace-aware):
```bash
kubectl get pods -A | grep -i <app-name>
kubectl get events -A --sort-by=.lastTimestamp | tail -n 150
```

3. If still unclear, switch to observability skill and query Loki logs for the same app namespace/pod labels.

---

## 6) Stop vs delete semantics

- `nebari_app_stop`: stops runtime, keeps definition.
- `nebari_app_delete`: removes definition/server entry.

Use `stop` first when user wants pause/restart behavior without losing config.

---

## Reference
- Read `references/jhub-apps-limitations.md` for known operational limitations and triage order.
