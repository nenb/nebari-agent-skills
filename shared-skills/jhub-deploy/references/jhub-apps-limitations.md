# jhub-apps / nebari_app_* Operational Limits

These limits apply in local k3s and cloud Kubernetes deployments alike.

## Functional limits
1. One named server per app name per user.
2. Replacing same app name is restart-based (no zero-downtime replacement).
3. Startup diagnostics from `/_temp/jhub-app-proxy/...` can be transient.
4. Public/auth behavior depends on JupyterHub + gateway config.
5. `custom` framework correctness depends on user command and lifecycle behavior.

## Wrapper-specific limits (current CLI)
1. Supported frameworks: `streamlit`, `panel`, `voila`, `gradio`, `jupyterlab`, `custom`.
2. `custom` command must be module-style and include `{port}`.
3. Cross-user actions are blocked by default.
   - override only with `NEBARI_APP_ALLOW_OTHER_USERS=1`.
4. `nebari_app_logs` may fall back to status summary if temp log endpoint is unavailable.

## Triage order
1. `nebari_app_status --name <name> --json`
2. `nebari_app_logs --name <name> --lines 300`
3. `nebari_app_doctor --name <name> --json`
4. Inspect user options for bad framework/filepath/profile.
5. If `kubectl` available, inspect pods/events cluster-side:
```bash
kubectl get pods -A | grep -i <name>
kubectl get events -A --sort-by=.lastTimestamp | tail -n 150
```

## Common failure patterns
- `ImagePullBackOff` / `ErrImagePull`
- `CrashLoopBackOff`
- pending pods from CPU/memory/PVC constraints
- wrong `custom` command semantics
- wrong profile or missing image/runtime deps
