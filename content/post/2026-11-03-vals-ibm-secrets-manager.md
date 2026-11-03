---
title: "Contributing IBM Cloud Secrets Manager support to vals"
date: '2026-11-03'
layout: post
slug: vals-ibm-secrets-manager
summary: "vals resolves secret references into Helm values and configuration files at deploy time. After building an internal Node.js prototype for IBM Cloud Secrets Manager on OpenShift, I contributed native Go provider support upstream. It shipped in vals v0.50.0."
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

Secrets have to reach the cluster at deployment time without being committed to git, pasted into a pipeline definition, or left in a build log. Doing that cleanly is harder than it sounds.

When deploying applications with Helm or Helmfile to Kubernetes or OpenShift, you typically have two bad options and one sensible one. You can commit encrypted secrets into git (which complicates rotation and access controls), maintain bespoke deployment scripts with environment variable substitution, or use a tool designed specifically to resolve references to a secret manager just before rendering manifests.

[vals](https://github.com/helmfile/vals) belongs firmly to the third category. It is a lightweight Go tool and library that resolves `ref+<provider>://...` URIs in YAML configuration files on the fly. It is widely used across the Kubernetes ecosystem, particularly as the secret-resolution engine inside [Helmfile](https://github.com/helmfile/helmfile).

`vals` supports an extensive range of secret backends out of the box, for example:

- HashiCorp Vault (`ref+vault://...`)
- AWS Secrets Manager (`ref+awssecrets://...`)
- AWS Systems Manager Parameter Store (`ref+awsssm://...`)
- Google Cloud Secret Manager (`ref+gcpsecrets://...`)
- Azure Key Vault (`ref+azurekeyvault://...`)
- Doppler (`ref+doppler://...`)
- 1Password (`ref+op://...`)
- SOPS (`ref+sops://...`)

When working on deployments to an internal OpenShift cluster backed by [IBM Cloud Secrets Manager](https://cloud.ibm.com/docs/secrets-manager) for credential storage (such as Cloud Object Storage S3 credentials, database connection strings, and IAM API keys), there was an obvious gap: `vals` had no provider for IBM Cloud. As of v0.50.0, it does.

Other teams had worked around the same gap with custom bash scripts that pulled from their own password vaults. That is fine for a one-off prototype, but it does not scale.

## The prototype

I started with a small standalone Node.js tool for our internal deployment pipelines. It performed the same basic job: parse Helm values templates, spot IBM Cloud Secrets Manager references, fetch the payloads over the [Secrets Manager v2 API](https://cloud.ibm.com/docs/apis/secrets-manager/secrets-manager-v2), and emit a clean `values.yaml` for Helm.

It worked well, and the pattern quickly proved its value across team deployments. But maintaining bespoke internal wrapper scripts when an established, community-standard tool already solves the same problem for most other providers is an anti-pattern.

The natural next step was to port the logic to Go and contribute native provider support directly to `vals`. The upstream code still says as much: its comments describe the payload extraction and path walking as mirroring the Node.js reference implementation.

The Node.js tool was also packaged as a Helm v4 plugin, which `vals` does not provide itself. [helm-secrets](https://github.com/jkroepke/helm-secrets) already covers much of that ground, so whether a separate Helm plugin wrapper is worth building is an open question.

## The IBM Cloud Secrets Manager provider

The provider uses the [IBM Secrets Manager Go SDK](https://github.com/IBM/secrets-manager-go-sdk) to talk to the Secrets Manager v2 API.

Secrets Manager organises secrets into secret groups and supports distinct secret types. The provider supports three of them: `arbitrary`, `kv`, and `service_credentials`. Any other type is rejected with an `unsupported secret type` error.

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

- `<group>`: the secret group name (use `default` for the default group).
- `<type>`: one of `arbitrary`, `kv`, or `service_credentials`.
- `<name>`: the secret name.
- `#/<jsonpath>`: optional slash-delimited path into the secret payload. It applies to `kv` and `service_credentials`; `arbitrary` secrets are always returned whole.

### Secret type behaviour

Different secret types store their payloads under different fields in the Secrets Manager API response:

| Type | Payload source | Fragment (`#/`) |
|---|---|---|
| `arbitrary` | `secret.payload`, returned as a plain string | Not used |
| `kv` | `secret.data`, a JSON object | Path into the object, e.g. `#/database/password` |
| `service_credentials` | `secret.credentials`, a JSON object | Path into the credentials, e.g. `#/apikey` |

When no fragment is given for `kv` or `service_credentials`, the entire JSON object is returned as a serialised string.

A few details of the path handling are worth knowing:

- The path walks objects only. There is no way to index into an array.
- A missing key fails with `key "<name>" not found in secret data`.
- A string at the end of the path is returned as is; any other type (number, boolean, nested object) is returned as JSON.
- The lookup is by group, type, and name. The provider has no version parameter.

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

# Resolve the references and stream the result to Helm
vals eval -f values.yaml | helm upgrade --install my-app ./charts/my-app -f -
```

### With helm-secrets

The [helm-secrets](https://github.com/jkroepke/helm-secrets) plugin can use `vals` as its backend. Select it explicitly, otherwise helm-secrets defaults to `sops`:

```bash
# Using helm-secrets with the vals backend
helm secrets --backend vals upgrade --install my-app ./charts/my-app -f values.yaml
```

The plugin invokes `vals` to resolve the `ref+ibmsecrets://` references during the Helm run. The backend can also be set once with the `HELM_SECRETS_BACKEND` environment variable.

Helmfile embeds `vals` and resolves the references before applying releases to the cluster, so no extra plugin is needed there.

---

The provider was merged upstream ([PR #1344](https://github.com/helmfile/vals/pull/1344)) and is published as part of [vals v0.50.0](https://github.com/helmfile/vals/releases/tag/v0.50.0). Thanks to the vals maintainers for reviewing and merging it. Use that release or later of the `vals` CLI to get `ref+ibmsecrets://`. Helmfile bundles its own copy of `vals`, so Helmfile users need a Helmfile release built against v0.50.0 or later.

For further details on integrating `vals` into Helm, Helmfile, or CI/CD pipelines, consult the [vals documentation](https://github.com/helmfile/vals) and the [helm-secrets documentation](https://github.com/jkroepke/helm-secrets).
