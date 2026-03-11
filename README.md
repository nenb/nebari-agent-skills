# nebari-agent-skills

Shared skills catalog for Nebari Pi pack.

This repository publishes versioned artifacts that the Pi pack consumes via URL:

- `shared-skills-<sha>.tar.gz` (immutable)
- `shared-skills.tar.gz` (latest)
- matching `.sha256` files

## Repository layout

```text
shared-skills/
  jhub-deploy/
  observability/
```

## CI publishing

Workflow:

- `.github/workflows/publish-shared-skills.yml`

Trigger:

- Push to `main` when files under `shared-skills/**` change
- Manual dispatch

Release tag format:

- `pi-shared-skills-<short-sha>`

## Pi pack integration

Use URL sync mode in `nebari-pi-pack` values:

```yaml
pi:
  sharedSkills:
    mode: pvc-subpath
    sync:
      enabled: true
      releaseId: pi-shared-skills-<short-sha>
      source:
        type: url
        url: https://github.com/nenb/nebari-agent-skills/releases/download/pi-shared-skills-<short-sha>/shared-skills-<short-sha>.tar.gz
        sha256: <artifact-sha256>
```
