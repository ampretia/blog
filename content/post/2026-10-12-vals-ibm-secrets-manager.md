---
title: "Contributing IBM Cloud Secrets Manager support to vals"
date: '2026-10-12'
layout: post
slug: vals-ibm-secrets-manager
summary: "vals resolves secret references into Helm values and configuration files at deploy time. After building an internal Node.js prototype for IBM Cloud Secrets Manager on OpenShift, I contributed native Go provider support upstream."
tags:
    - kubernetes
    - openshift
    - security
    - golang
    - helm
    - open-source
keywords:
    - vals
    - helm
    - helmfile
    - ibm cloud secrets manager
    - secrets management
    - openshift
    - kubernetes
---

Correct secret handling is a basic architectural requirement, but injecting them cleanly at deployment time can often get too complicated and inelegant. 

When deploying applications with Helm or Helmfile to Kubernetes or OpenShift, you typically have two bad options and one sensible one. You can commit encrypted secrets into git (which complicates rotation and access controls), maintain bespoke deployment scripts with environment variable substitution, or use a tool designed specifically to resolve references to a secret manager just before rendering manifests.

[vals](https://github.com/helmfile/vals) belongs firmly to the third category. It is a lightweight Go tool and library that resolves `ref+<provider>://...` URIs in YAML configuration files on the fly. It is widely used across the Kubernetes ecosystem—particularly as the secret-resolution engine inside [Helmfile](https://github.com/helmfile/helmfile).

`vals` supports an extensive range of secret backends out of the box for example:

- HashiCorp Vault (`ref+vault://...`)
- AWS Secrets Manager (`ref+awssecrets://...`)
- AWS Systems Manager Parameter Store (`ref+awsssm://...`)
- Google Cloud Secret Manager (`ref+gcpget://...`)
- Azure Key Vault (`ref+azurekeyvault://...`)
- Doppler (`ref+doppler://...`)
- 1Password (`ref+op://...`)
- SOPS (`ref+sops://...`)

When working on deployments to an internal OpenShift cluster backed by [IBM Cloud Secrets Manager](https://cloud.ibm.com/docs/secrets-manager) for credential storage (such as Cloud Object Storage S3 credentials, database connection strings, and IAM API keys), there was an obvious gap: `vals` had no provider for IBM Cloud.

I did know that other teams had used custom bash scripts to pull out of their own password vaults — fine for a small one-time prototype, but it does not scale as a longer-term solution.

## The prototype

Before diving straight into upstream Go codebases, I initially built a small standalone Node.js tool for our internal deployment pipelines. It performed the same basic job: parse Helm values templates, spot IBM Cloud Secrets Manager references, fetch the payloads over the [Secrets Manager v2 API](https://cloud.ibm.com/docs/apis/secrets-manager/secrets-manager-v2), and emit a clean `values.yaml` for Helm.

It worked well, and the pattern quickly proved its value across team deployments. But maintaining bespoke internal wrapper scripts when an established, community-standard tool already solves the exact problem for every other cloud provider is an anti-pattern.

The natural next step was to port the logic to Go and contribute native provider support directly to `vals`.

The Node.js tool also implemented a Helm v4 plugin interface — something `vals` leaves to the caller. That removed the need for any additional tooling in that pipeline, though it is worth revisiting whether a proper Helm plugin wrapper makes sense as a separate project.

## The IBM Cloud Secrets Manager provider

The upstream contribution integrates the [IBM Secrets Manager Go SDK](https://github.com/IBM/secrets-manager-go-sdk) to talk to the Secrets Manager v2 API.

Secrets Manager organises secrets into secret groups and supports distinct secret types. The provider supports the three most common types used in application deployments: `arbitrary`, `kv`, and `service_credentials`.

### Authentication

Authentication uses standard IBM Cloud IAM credentials, configurable via environment variables or configuration keys:

| Environment variable | Config key | Description |
|---|---|---|
| `IBMCLOUD_API_KEY` | `api_key` | IBM Cloud IAM API key (required) |
| `IBMCLOUD_SM_SERVICE_URL` | `service_url` | Full service endpoint URL of your Secrets Manager instance (required) |

The service endpoint URL has the form:

```text
https://<instance-id>.<region>.secrets-manager.appdomain.cloud
```

Config keys take precedence over environment variables when supplied directly.

### URI format

Secrets are referenced using the `ref+ibmsecrets://` scheme:

```text
ref+ibmsecrets://secret_groups/<group>/secret_types/<type>/secrets/<name>[#/<jsonpath>]
```

- `<group>` — the secret group name (use `default` for the default group).
- `<type>` — one of `arbitrary`, `kv`, or `service_credentials`.
- `<name>` — the secret name.
- `#/<jsonpath>` — optional slash-delimited path into the secret payload (required for `kv` and `service_credentials`; not applicable to `arbitrary`).

### Secret type behaviour

Different secret types store their payloads under different fields in the Secrets Manager API response:

| Type | Payload source | Fragment (`#/`) |
|---|---|---|
| `arbitrary` | `secret.payload` — returned as a plain string | Not used |
| `kv` | `secret.data` — a JSON object | Path into the object, e.g. `#/database/password` |
| `service_credentials` | `secret.credentials` — a JSON object | Path into the credentials, e.g. `#/apikey` |

When no fragment is given for `kv` or `service_credentials`, the entire JSON object is returned as a serialized string.

### Examples

In your Helm `values.yaml` or Helmfile definition:

```yaml
# Retrieve an arbitrary secret (plain string payload)
db_password: ref+ibmsecrets://secret_groups/prod/secret_types/arbitrary/secrets/db-password

# Retrieve a specific key from a key-value secret
db_host: ref+ibmsecrets://secret_groups/prod/secret_types/kv/secrets/db-config#/host

# Retrieve the IAM API key from a service_credentials secret (e.g. Cloud Object Storage / S3 binding)
cos_apikey: ref+ibmsecrets://secret_groups/prod/secret_types/service_credentials/secrets/cos-binding#/apikey
```

When evaluated with `vals`:

```bash
export IBMCLOUD_API_KEY="<your-iam-api-key>"
export IBMCLOUD_SM_SERVICE_URL="https://xxxx.us-south.secrets-manager.appdomain.cloud"

# Resolve values in-place or stream to helm
vals eval -f values.yaml | helm upgrade --install my-app ./charts/my-app -f -
```

### With helm-secrets

If you use the [helm-secrets](https://github.com/jkroepke/helm-secrets) plugin, `vals` is supported natively as a secrets driver. You can pass the values file containing `ref+ibmsecrets://` references directly:

```bash
# Using helm-secrets with the vals backend
helm secrets upgrade --install my-app ./charts/my-app -f values.yaml
```

The plugin invokes `vals` under the hood to decrypt and inject the secrets during chart rendering without leaving decrypted copies on disk.

Similarly, when using [Helmfile](https://github.com/helmfile/helmfile), `vals` resolves the references automatically before applying releases to the cluster.

---

The pull request adding IBM Cloud Secrets Manager support is currently open with the upstream [vals project](https://github.com/helmfile/vals). For further details on integrating `vals` into Helm, Helmfile, or CI/CD pipelines, consult the [vals documentation](https://github.com/helmfile/vals) and the [helm-secrets documentation](https://github.com/jkroepke/helm-secrets).
