---
title: "SmallRye Config without the container"
date: '2026-10-06'
layout: post
slug: smallrye-config-standalone
summary: "SmallRye Config works outside Quarkus and MicroProfile. Here is a standalone example that wires CLI args, env vars, YAML files, and type-safe mappings together in a plain Java main()."
tags:
    - java
    - configuration
    - smallrye
    - quarkus
    - engineering
keywords:
    - smallrye config
    - java configuration
    - standalone
    - configmapping
    - quarkus
    - environment variables
    - yaml
---

Python has the configuration story largely sorted. Between `argparse`, `click`, `pydantic-settings`, and a handful of smaller libraries, you can wire up CLI arguments, environment variables, and config files into a validated, typed object in a few dozen lines. The ecosystem is well-documented and the patterns are well-understood.

Java has not always felt that way. The standard library gives you `System.getProperty` and `System.getenv`. Every framework ships its own config mechanism, and they do not compose. For standalone applications — things that run as a `main()` rather than inside a servlet container or CDI runtime — the choices have historically ranged from hand-rolled property loading to full dependency injection frameworks that feel like bringing a forklift to move a box.

A few years ago I started using Quarkus for some new work after a long gap away from the Java ecosystem. Inside Quarkus I found [SmallRye Config](https://smallrye.io/smallrye-config/), which implements the MicroProfile Config specification and layers a lot of useful things on top. The Quarkus integration is tight and well-documented. What was less obvious from the documentation was whether it would work in a plain Java process without CDI, without MicroProfile, without any container at all.

It does. And it works well.

## What I needed

The usual things: merge values from a bundled YAML file, external config files, environment variables, system properties, and CLI arguments. Validate at startup. Fail loudly with all problems listed at once rather than one surprise at a time. Handle nested structures, lists, maps, and enums. Support profiles so a `dev` environment can differ from `prod` without separate config files for every key.

SmallRye Config covers all of that. The `@ConfigMapping` annotation lets you describe the shape of your configuration as a Java interface, and the library generates the implementation and validates it at build time. If a required key is missing, or a value cannot be converted to the declared type, or a key in the command-line arguments does not match anything in the mapping — startup fails with a clear error listing every problem at once.

```console
$ app --app.port=abc --app.proxy=nocolon --app.nmae=typo
Invalid configuration:
  - app.port with the config value "abc": Expected an integer value, got "abc"
  - app.proxy with the config value "nocolon": Expected host:port but got 'nocolon'
  - app.server.tls.password is required but it could not be found in any config source
  - SRCFG00050: app.nmae in CommandLineConfigSource does not map to any root
```

That last error — an unknown key — is particularly useful. A typo in a CLI argument or env var is caught rather than silently ignored.

## Building the config by hand

The standard Quarkus path uses CDI to inject `@ConfigProperty` and `@ConfigMapping` beans. Without CDI you do that assembly step yourself, which is not much code:

```java
SmallRyeConfig config = new SmallRyeConfigBuilder()
    .addDefaultInterceptors()                         // ${expr}, %profile, relocations
    .withSources(cli, sysProps, env, file, classpath) // explicit, ordered by ordinal
    .withConverter(HostPort.class, 100, new HostPortConverter())
    .withMapping(AppConfig.class)                     // generate + validate the interface
    .build();

AppConfig app = config.getConfigMapping(AppConfig.class);
```

Each source has a numeric ordinal. A higher ordinal wins for any key present in multiple sources. The sources do not replace each other — they merge. A key absent from the command line is still resolved from env vars, then from the external file, then from the classpath YAML, then from `@WithDefault` annotations on the interface. You get the highest-priority value for each key independently.

## The example

I distilled this into a standalone example at [github.com/ampretia/smallrye-app-example](https://github.com/ampretia/smallrye-app-example). It is a plain Gradle project with a `main()` class, 25 tests, and no framework dependencies beyond SmallRye itself. The README below covers the layout, the source priority order, the full range of supported types, and several worked examples showing exactly what the priority resolution looks like at runtime.

---

## README

*The following is the README from the repository, reproduced here for reference.*

### SmallRye Config standalone example

This is a plain Java `main()` application. It uses [SmallRye Config](https://smallrye.io/smallrye-config/)
to merge configuration from files, environment variables, system properties and command-line
arguments into one type-safe object. It runs without CDI, Jakarta EE, Quarkus or an
application server.

```bash
./gradlew test                       # 25 tests covering every source and type
./gradlew run                        # print resolved config + where each value came from
./gradlew run --args="--app.port=9000 --smallrye.config.profile=dev"
```

### Layout

| File | Purpose |
| ---- | ------- |
| [`AppConfig.java`](https://github.com/ampretia/smallrye-app-example/blob/main/app/src/main/java/org/example/config/AppConfig.java) | `@ConfigMapping` interface: every supported type |
| [`ConfigFactory.java`](https://github.com/ampretia/smallrye-app-example/blob/main/app/src/main/java/org/example/config/ConfigFactory.java) | Builds `SmallRyeConfig` by hand; defines source order |
| [`CommandLineConfigSource.java`](https://github.com/ampretia/smallrye-app-example/blob/main/app/src/main/java/org/example/config/CommandLineConfigSource.java) | Turns `--key=value` args into a config source |
| [`HostPort.java`](https://github.com/ampretia/smallrye-app-example/blob/main/app/src/main/java/org/example/config/HostPort.java) / [`HostPortConverter.java`](https://github.com/ampretia/smallrye-app-example/blob/main/app/src/main/java/org/example/config/HostPortConverter.java) | Custom value type + `Converter` |
| [`application.yaml`](https://github.com/ampretia/smallrye-app-example/blob/main/app/src/main/resources/application.yaml) | Packaged defaults and a `%dev` profile |
| [`config/prod.yaml`](https://github.com/ampretia/smallrye-app-example/blob/main/config/prod.yaml), [`config/override.properties`](https://github.com/ampretia/smallrye-app-example/blob/main/config/override.properties) | Example external files |
| [`App.java`](https://github.com/ampretia/smallrye-app-example/blob/main/app/src/main/java/org/example/App.java) | Prints typed values, raw lookups and provenance |

### How it works without a container

SmallRye Config is a library. In Quarkus or a MicroProfile server the runtime builds the config
and injects `@ConfigProperty` / `@ConfigMapping` beans. Standalone, you do those steps yourself:

```java
SmallRyeConfig config = new SmallRyeConfigBuilder()
    .addDefaultInterceptors()                        // ${expr}, %profile, relocations
    .withSources(cli, sysProps, env, file, classpath) // explicit, ordered by ordinal
    .withConverter(HostPort.class, 100, new HostPortConverter())
    .withMapping(AppConfig.class)                    // generate + validate the interface
    .build();

AppConfig app = config.getConfigMapping(AppConfig.class);
```

`build()` generates the implementation of `AppConfig` and validates it eagerly. A missing required
value, a bad conversion, or an unknown `app.*` key (such as a typo) fails startup, and every
problem is listed at once.

`ConfigFactory.create(args, env, sysProps)` takes the environment as parameters instead of reading
it globally, so tests can build any scenario without changing process state.

### Sources and priority

Values are resolved **per key**. A higher ordinal hides the same key in lower sources, while all
other keys still come from below. Sources merge; they do not replace each other.

| Ordinal | Source | Example |
| ------- | ------ | ------- |
| 500 | Command line | `--app.port=9000`, `--app.debug` (bare flag = `true`) |
| 400 | System properties | `-Dapp.port=9000` (via `JAVA_OPTS`) |
| 300 | Environment | `APP_PORT=9000` |
| 275 | External file (YAML or .properties) | `--app.config-file=config/prod.yaml` or `APP_CONFIG_FILE=...` |
| 250 | Classpath `application.yaml` | packaged defaults |
| min | `@WithDefault` in `AppConfig` | code defaults |

The external file location is itself configuration. `ConfigFactory` builds a small bootstrap config
from CLI, system properties and env to find it, then builds the real config.

#### Environment variable names

SmallRye maps env vars back to property names. Every character that is not a letter or digit
becomes `_`, and the result is upper-cased:

| Property | Env var |
| -------- | ------- |
| `app.port` | `APP_PORT` |
| `app.sample-rate` | `APP_SAMPLE_RATE` |
| `app.server.tls.password` | `APP_SERVER_TLS_PASSWORD` |
| `app.datasources.orders.pool-size` | `APP_DATASOURCES_ORDERS_POOL_SIZE` |
| `app.endpoints[1].retries` | `APP_ENDPOINTS_1__RETRIES` (note `__`) |
| `smallrye.config.profile` | `SMALLRYE_CONFIG_PROFILE` |

Because `@ConfigMapping` knows the structure, env vars can **add** new map entries
(`APP_DATASOURCES_REPORTING_URL` creates a `reporting` datasource), not only override existing ones.

### Representing different kinds of values

All of these are in `AppConfig.java` and covered by `ConfigFactoryTest`.

#### Basic types and defaults

| Kind | Declaration | Config |
| ---- | ----------- | ------ |
| String (required) | `String name()` | `app.name=x` |
| String (optional) | `Optional<String> description()` | may be absent |
| Renamed key | `@WithName("env") String environment()` | `app.env=prod` |
| Primitives | `int port()`, `boolean debug()`, `double sampleRate()`, `long maxPayloadBytes()` | `app.sample-rate=0.5` |
| Optional primitive | `OptionalInt workerThreads()` | may be absent |
| Defaults | `@WithDefault("8080")` | fallback if omitted |
| Enum | `LogLevel logLevel()` | `warn` / `WARN` |
| Built-in conversion | `Duration`, `URI` | `PT30S` |
| Custom type | `Optional<HostPort> proxy()` + `HostPortConverter` | `proxy.corp:3128` |
| Derived value | `default boolean tlsEnabled()` | computed |

#### Collections, maps, and groups

| Kind | Declaration | Config |
| ---- | ----------- | ------ |
| List of values | `List<String> tags()` | `a,b,c` or `tags[0]=a` or YAML sequence |
| List of custom type | `List<HostPort> peers()` | `a:1,b:2` |
| Nested group | `Server server()` | `app.server.host` |
| Optional group | `Optional<Tls> tls()` | present if any `tls.*` set |
| Map of groups | `Map<String, Datasource> datasources()` | `app.datasources.<name>.url` |
| List of groups | `List<Endpoint> endpoints()` | `app.endpoints[0].url` |
| Free-form map | `Map<String,String> labels()` | `app.labels.<anything>=v` |
| Untyped group (`@WithParentName`) | `Map<String, Plugin> plugins()` | `app.plugins.<name>.<anything>=v` |

Other features: expression expansion (`${app.name}`, `${KEYSTORE_PASSWORD:changeit}`), profiles (`%dev` in YAML), and provenance reporting so you can see which source supplied each value.

### Try it

Build the distribution first:

```bash
./gradlew installDist
```

The executable is at `./app/build/install/app/bin/app`.

**Default packaged config**

```console
$ ./app/build/install/app/bin/app
== Config sources (highest priority first)
          500  CommandLineConfigSource
          400  PropertiesConfigSource[source=SysPropConfigSource]
          300  EnvConfigSource
          250  YamlConfigSource[source=jar:.../app.jar!/application.yaml]
  -2147483648  DefaultValuesConfigSource

== Typed values from @ConfigMapping AppConfig
  name              (String)        smallrye-example
  port              (int)           8080
  logLevel          (enum)          INFO
  peers             (List<HostPort>)[node-a:7000, node-b:7000]
  server.tls        (Optional grp)  <none>
```

**CLI overrides**

```console
$ ./app/build/install/app/bin/app --app.port=9000 --app.log-level=error --app.peers=x:1,y:2
  port              (int)           9000
  logLevel          (enum)          ERROR
  peers             (List<HostPort>)[x:1, y:2]
```

**External YAML and expression expansion**

```console
$ KEYSTORE_PASSWORD=s3cret ./app/build/install/app/bin/app --app.config-file=config/prod.yaml
  port              (int)           80
  logLevel          (enum)          WARN
  proxy             (HostPort)      Optional[proxy.corp:3128]
  server.tls        (Optional grp)  keystore=/etc/app/keystore.p12 password=****
  tlsEnabled        (default meth)  true
```

**Profile activation**

```console
$ ./app/build/install/app/bin/app --smallrye.config.profile=dev
  environment       (@WithName env) dev
  debug             (boolean)       true
  logLevel          (enum)          DEBUG
  server            (group)         localhost:8443
```

**Dynamic env var mapping**

```console
$ APP_DATASOURCES_REPORTING_URL=jdbc:x://r APP_ENDPOINTS_1__RETRIES=42 ./app/build/install/app/bin/app
  datasources       (Map<String,Datasource>)
    orders     url=jdbc:postgresql://db:5432/orders
    customers  url=jdbc:postgresql://db:5432/customers
    reporting  url=jdbc:x://r
  endpoints         (List<Endpoint>)
    [0] billing  https://billing.internal/api retries=3
    [1] audit    https://audit.internal/api   retries=42
```

---

The full source, tests, and Gradle build are at [github.com/ampretia/smallrye-app-example](https://github.com/ampretia/smallrye-app-example).
