---
name: jhub-deploy
description: Use when Pi needs to deploy, update, stop, delete, or inspect Nebari apps through jhub-apps and jhub-app-proxy. Trigger this skill for requests like "deploy Streamlit app", "check app startup logs", "stop app", "delete app", or "why is app not reachable?".
---

# JHub Deploy (Second-Attempt Cluster)

Use the `nebari_app_*` wrappers available in the Pi image. They call JupyterHub APIs and jhub-app-proxy log endpoints.

## Fast Path
1. Deploy:
```bash
nebari_app_deploy --name <app-name> --framework <streamlit|panel|voila|gradio|jupyterlab|custom> --filepath <path>
```

2. Check status:
```bash
nebari_app_status --name <app-name>
```

3. Read startup/runtime logs:
```bash
nebari_app_logs --name <app-name>
```

4. Stop (keep definition) or delete (remove definition):
```bash
nebari_app_stop --name <app-name>
nebari_app_delete --name <app-name>
```

## Deployment Patterns
1. Streamlit:
```bash
nebari_app_deploy --name streamlit-demo --framework streamlit --filepath /home/nenb/apps/streamlit_app.py
```

2. Panel:
```bash
nebari_app_deploy --name panel-demo --framework panel --filepath /home/nenb/apps/panel_app.py
```

3. Custom command (module-style only on this stack):
```bash
nebari_app_deploy \
  --name custom-demo \
  --framework custom \
  --filepath /home/nenb/apps \
  --custom-command "my_package.server {--}port={port}"
```

> Do **not** include `python`, `python -m`, or script paths in `--custom-command` for this deployment.
> jhub-apps already prepends `python {-}m` in custom mode.

## Rules and Limitations
1. App names are normalized to lowercase-dash and map to named servers.
2. Same app name for the same user is a conflict unless redeployed with replacement.
3. jhub-app-proxy startup logs live under `/_temp/jhub-app-proxy/` while app is booting.
4. Framework choices are constrained to wrappers: `panel`, `streamlit`, `voila`, `gradio`, `jupyterlab`, `custom`.
5. For `custom`, pass only module/args; do **not** prefix with `python` or `python -m` (stack auto-injects it).
6. For `custom`, command must include port placeholder handling (`{port}` and typically `{--}`).
7. Validate every deploy with `nebari_app_status` + `nebari_app_logs` before reporting success.
8. App links should be opened as `/user/<username>/<app-name>/` (avoid `/hub/user/...` as canonical URL).
9. Profile selection must match existing JupyterHub profiles (`small`, `medium`, `large`, and Pi-specific profiles if applicable).
10. Stop and delete are separate operations; use stop first for non-destructive pause.

## References
- Read `references/jhub-apps-limitations.md` before proposing production-grade rollout plans.
