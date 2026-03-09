# jhub-apps and jhub-app-proxy Limitations

## Functional Limits
1. One named server per app name per user.
2. No zero-downtime rollout for same app name; replacement restarts server.
3. Startup diagnostics depend on jhub-app-proxy temp endpoints and may disappear after readiness.
4. Public exposure and auth behavior depend on jhub-apps settings and proxy routing.
5. Framework adapter behavior differs by framework and entrypoint expectations.

## Operational Limits
1. Profile choice is bounded by JupyterHub `profile_list`.
2. Resource contention is still Kubernetes scheduling; app deploy can be accepted while pod remains pending.
3. `custom` framework correctness is user responsibility (command, port wiring, process lifecycle).
4. Delete removes app definition; stop keeps definition but server can be started again.

## Triage Order for Failed Deployments
1. `nebari_app_status --name <name>`
2. `nebari_app_logs --name <name>`
3. Inspect `server.user_options` for wrong framework/filepath/profile.
4. Check namespace pod events:
```bash
kubectl -n nc get pods | grep <normalized-name>
kubectl -n nc describe pod <pod-name>
```
