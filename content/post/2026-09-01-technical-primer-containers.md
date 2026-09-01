---
title: "Technical Primer: Containers"
date: '2026-09-01'
layout: post
slug: technical-primer-containers
summary: "What Docker actually does, why a container is not a VM, and how a static image becomes a running process — for engineers and scientists who use the technology without yet owning it."
tags:
    - technical-primer
    - containers
    - docker
    - linux
    - engineering
keywords:
    - containers
    - docker
    - namespaces
    - cgroups
    - image
    - primer
series:
    - technical-primer
---

# Technical Primer: Containers

> What Docker actually does, why a container is not a VM, and how a static image becomes a running process — for engineers and scientists who use the technology without yet owning it.

---

This is part of an occasional series of short technical primers. There are two types of reader it is written for.

The first is not a software developer by training. You might be a researcher, a data scientist, a computational biologist, a physicist with a large dataset problem. You write code — possibly quite a lot of it — but your primary discipline is something else. Containers keep appearing in your work: a colleague shares a `Dockerfile`, a cluster job requires an image, a paper's reproducibility instructions start with `docker pull`. This primer is for understanding what is actually going on.

The second knows what software development is, but has spent their career in a particular corner of it — embedded systems, numerical computing, a specific domain stack — and somehow containers were always the thing the other team handled. Everybody around you seems to have absorbed this years ago. Nobody explains it because it feels too basic to explain. This is the explanation.

Both readers are welcome here. Neither is behind.

---

## The problem containers actually solve

You know how to run a Python script. You've installed libraries, wrestled with versions, and at some point hit the situation where the script runs fine on your machine and fails on the cluster — or ran fine six months ago and now doesn't, despite you changing nothing. Containers are the answer to most of that friction — but to understand *why*, it helps to step back and think about what's actually going on when you run any program at all.

Think about your laptop. There's the physical hardware — CPU, memory, disk. On top of that sits the operating system: Windows, macOS, Linux. Then there are applications, and somewhere in there is the Python script you've written to process some data.

Your laptop is the ultimate multi-purpose tool. It runs everything. And that is exactly the problem.

Every piece of software installed, every library updated, every system patch applied changes the environment slightly. Most of the time this doesn't matter. But for a simulation that depends on a specific version of a numerical library — one that itself wraps compiled Fortran or C code — or a machine learning pipeline pinned to a particular CUDA version, it absolutely does. Which Python is installed? Is it the system one, the one conda put somewhere else? Did `pip install` go to the right place? Did the C extension compile against the right version of the underlying library?

The overall environment any application runs in is constantly accumulating change. Think of it as entropy — over time, the state of your machine drifts further from the known-good state your code was written against. This is, incidentally, why "turn it off and on again" actually works: restarting a computer resets transient state back to a predictable baseline.

The computing world has been solving this problem for decades, and the general answer is **virtualisation**: create a controlled, isolated environment rather than relying on the shared one. The key question is always at what level of abstraction you virtualise.

A **Virtual Machine (VM)** virtualises at the hardware level. You define a virtual machine — how many CPUs, how much memory — install a full operating system into it, and run your code there. Genuinely useful; heavyweight. A full OS install takes time and consumes real resources even when idle.

Containers work at a higher level: the **operating system level** rather than the hardware level. Each container gets its own isolated filesystem, its own processes, its own network — but shares the kernel of the host. This makes containers dramatically lighter than VMs: faster to start, cheaper to run, and quick to discard when you're done.

That last point matters. Containers suit ephemeral patterns of work: spin one up to run a ten-minute processing job, then throw it away. The environment is completely controlled and the cost of creating it is low enough to treat it as disposable.

## A note on terminology: aren't these "Docker containers"?

Docker became synonymous with containers in the same way Hoover became synonymous with vacuum cleaners. Docker was the company and tool that pushed container technology into mainstream use and defined many of the standards. Other tools exist — Podman, containerd, OCI-compliant runtimes — but they follow the same standards Docker established. When someone says "Docker container" they usually just mean "container".

The distinction matters less than understanding the underlying concept — which is what the rest of this primer is for.

---

## The question everyone sidesteps

Ask someone what a container is and you will almost always get one of two answers. Either "it's like a VM but lighter" — vague and slightly wrong — or a paragraph about Docker commands and image registries that answers a different question entirely.

The actual answer is more specific and more interesting: **a container is a process with a restricted view of the machine it is running on.** That is it. No separate kernel. No hardware simulation. Just a process that has been handed a very limited and carefully constructed picture of the world.

Understanding _how_ that restriction works is what makes everything else click.

---

## What a virtual machine actually does

To appreciate why containers are not VMs, it helps to be precise about what a VM is.

A virtual machine emulates an entire physical machine. The hypervisor (VMware, KVM, Hyper-V, and so on) presents fake hardware — fake CPU, fake RAM, fake disks — to the guest. The guest OS boots as if it owns real hardware, runs its own kernel, manages its own memory, drives its own devices. The guest has no idea it is a tenant. From the guest's perspective it is the only thing running.

This is thorough and flexible. It is also expensive. The guest kernel has to boot. Memory has to be allocated in advance or carefully managed. CPU cycles go to two schedulers — the host's and the guest's.

A container does none of this. There is no second kernel. The container's process runs directly on the host kernel, subject to the same scheduler and memory allocator as everything else. What changes is _what the process can see_ — not how the kernel processes its system calls.

---

## Namespaces: the restricted view

Linux namespaces are the foundational mechanism. A namespace wraps a global resource and presents a process with an isolated instance of that resource. The key ones:

**PID namespace.** Inside the container, the first process has PID 1. It believes it is the only process on the machine. Outside, the host can see it as PID 14882, or whatever the kernel assigns. Same process, two names.

**Network namespace.** The container gets its own network stack — its own loopback, its own interface, its own routing table, its own port space. Port 8080 inside the container does not conflict with port 8080 on the host, or port 8080 in another container. They are entirely separate namespaces.

**Mount namespace.** The container sees a different filesystem tree. From inside, `/` is the container's root. The host's `/etc`, `/home`, the rest of the host's filesystem — invisible, unless explicitly mounted in.

**UTS namespace.** The container can have its own hostname. Useful for logging; irrelevant until it isn't.

**User namespace.** The container can have its own user IDs. Root inside a container is not necessarily root on the host. This is how rootless containers work.

None of this is Docker-specific. Namespaces are a kernel feature that has existed since Linux 3.8. Docker uses them. So does Podman, containerd, and anything else that runs containers.

### When platforms add more on top

The namespace and cgroup mechanisms described here are what the Linux kernel provides. Production container platforms — OpenShift being the prominent example — apply a further layer of policy on top of them.

OpenShift enforces **Security Context Constraints (SCCs)** by default. The most visible consequence for anyone running a container for the first time on an OpenShift cluster: your container will likely refuse to start unless it is written to run as a non-root, arbitrarily assigned user ID. OpenShift assigns a random UID from a high-numbered range — typically something in the hundreds of thousands — to each container in each namespace, and that UID rotates between deployments. A container image that hardcodes `USER 1000` in its Dockerfile, or assumes it will always run as the same UID, will behave unexpectedly or fail outright.

The reason is deliberate. If a process escapes the container's namespace through a kernel vulnerability, the process that lands on the host is running as an essentially meaningless high-numbered UID with no privileges on the host filesystem. The blast radius shrinks.

Other constraints OpenShift applies by default: containers cannot run as UID 0 (root), cannot request privileged mode, cannot mount host paths unless explicitly permitted, and cannot use certain Linux capabilities that a plain Docker environment would allow. Images built and tested locally with plain Docker will often work on OpenShift without modification — but images that rely on root access, fixed UIDs, or privileged operations will need adjustment.

If you are deploying to OpenShift and your container works on your laptop but fails on the cluster with a permission error, the SCC is almost certainly the reason.

---

## cgroups: the resource ceiling

Namespaces control visibility. Control groups (cgroups) control consumption.

A cgroup assigns a process — or a set of processes — to a group and enforces limits on what that group can consume: CPU shares, memory ceiling, I/O bandwidth, number of open files. Without cgroups, a container that leaks memory or spins a tight loop has full access to everything the host has. With them, it hits a wall.

When you write:

```yaml
resources:
  limits:
    memory: "512Mi"
    cpu: "500m"
```

in a Kubernetes manifest, that is a cgroup configuration. The scheduler allocates the pod; the kernel enforces the ceiling.

Together, namespaces and cgroups are what makes a container: isolated view, bounded resources. Both are kernel features. Docker is a tool that sets them up on your behalf.

---

## The image: a filesystem in a box

The word "image" is slightly misleading. An image is not an executable. It is a layered, read-only filesystem snapshot — specifically, an ordered stack of tar archives, each one recording the delta from the previous layer.

Consider a Dockerfile:

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "main.py"]
```

Each instruction produces a layer:

1. `FROM` — the base layer, pulled from a registry: a minimal Debian filesystem with Python installed.
2. `WORKDIR` — creates `/app`.
3. `COPY requirements.txt .` — adds one file.
4. `RUN pip install` — installs packages. This layer can be hundreds of megabytes.
5. `COPY . .` — adds your application code.

The layers are content-addressed: each is identified by a SHA256 hash of its contents. If you rebuild with the same base and the same `requirements.txt`, layers 1–4 are already cached. Only layer 5 re-runs. This is why Docker builds feel fast the second time.

When you push an image to a registry, the layers are uploaded individually. Pull it elsewhere and only the layers you don't already have are transferred.

---

## From image to process: what `docker run` actually does

`docker run python:3.12-slim python main.py` is not magic. It is a sequence of well-defined operations:

1. **Pull the image** (if not cached). Fetch and verify each layer.
2. **Create a container filesystem.** Stack the read-only image layers, then add a thin, writable layer on top via an overlay filesystem (overlayfs on most Linux systems). The running container writes to this top layer; the image layers below are never modified.
3. **Set up namespaces.** Create PID, network, mount, UTS, and IPC namespaces for this container.
4. **Configure cgroups.** Apply resource limits.
5. **Set the root.** `chroot` (or more precisely `pivot_root`) into the container's filesystem, so `/` inside the container is the image's root.
6. **Start the process.** Fork and exec the entry point: `python main.py`. From this point it is a normal process on the kernel scheduler.

The container is alive. When the process exits, the container stops. The writable layer is preserved until you run `docker rm`.

---

## The writable layer problem

This is the source of one of the most common container mistakes.

Files written inside a running container land in the writable layer. That layer is ephemeral — it disappears when the container is removed. Write a trained model, a database, a log file, anything you want to persist — and then `docker rm` — and it is gone.

The solution is volumes: a host path (or a managed volume) mounted into the container namespace at a specific path. Anything written there bypasses the writable layer entirely and lands on persistent storage.

```bash
docker run -v /data/myapp:/app/output myimage
```

Writes to `/app/output` inside the container go to `/data/myapp` on the host. Remove the container, the data remains.

**The ownership problem.** Files written to a mounted volume are owned by whatever user ID the container process was running as — and that UID is interpreted by the host filesystem using the host's user database, not the container's. If the container runs as UID 1000 and no user with UID 1000 exists on the host, the files land on the host as an anonymous numeric UID. The host user who mounted the volume may have no permission to read or delete them without `sudo`.

The same problem appears in reverse: if the container process runs as a high-numbered arbitrary UID — as OpenShift requires — and the mounted directory on the host is owned by a specific user, the container may be unable to write there at all.

The practical fix is to ensure the mounted directory has permissions that allow the UID the container will run as, or to use named managed volumes rather than host-path bind mounts, and let the platform manage ownership. On OpenShift specifically, the `fsGroup` security context setting can be used to force a particular group ownership on mounted volumes, which is the standard way around this.

This is also why stateful applications — databases, object stores — treat containers with some caution. The storage story has to be explicit, and ownership is part of that story.

---

## Why it matters that there is one kernel

Everything described above shares a kernel. The container's process uses the host's system call interface. This has two direct consequences worth naming.

**Security surface.** A vulnerability in the kernel is a vulnerability reachable from inside any container on the host. Containers are not a security boundary in the same way a VM is. Namespaces prevent visibility; they do not prevent a determined attacker from escaping via a kernel exploit. Running containers as non-root, using seccomp profiles to restrict system calls, and keeping the kernel patched all matter here. Enterprise platforms like OpenShift take this further by enforcing policy at the cluster level — restricting which UIDs containers may use, which capabilities they may request, and what host resources they may touch — rather than relying on individual image authors to get it right.

**Platform dependency.** A Linux container requires a Linux kernel. On macOS and Windows, Docker runs a lightweight Linux VM to provide that kernel. This is the VM you never see: it is the thin layer that makes `docker run` on a laptop feel native when it is not quite. On a Linux host, there is no such layer.

---

## What this means in practice

If you are running a training job, a data pipeline, a model-serving script, or a reproducible experiment in a container, the following now has a concrete meaning rather than being received wisdom:

- **"Containers are immutable."** The image layers are read-only. Your code, your dependencies, your base OS are frozen at build time. To update them you rebuild and redeploy a new image — you do not SSH in and `pip install` into a running container. (You can. You should not. Nothing you install survives a restart.) This is the property that makes results reproducible months later: the environment that produced them is preserved in the image.
- **"Keep containers stateless."** Because the writable layer is ephemeral. If you need to keep results, trained model weights, or output data, that state belongs in a mounted volume or an external storage service — not written inside the container.
- **"Don't run as root inside a container."** Because root inside the container is closer to root on the host than it looks. On a shared HPC cluster or cloud environment this matters. User namespaces add a layer; they are not universally deployed by default.
- **"Use multi-stage builds."** Because every layer in your final image is surface area. A build stage can install compilers, CUDA toolkits, and dev tooling; the final stage copies only what the running process needs. Smaller images pull faster on a cluster and reduce the chance of shipping something you didn't intend to.
- **"The image is the reproducibility artefact."** A paper that ships a container image alongside its code is providing something far stronger than a `requirements.txt`. The exact OS, the exact library versions, the exact binary dependencies — all frozen. Someone running the image two years later is running the same environment you ran.

---

## The short version

A container is a Linux process running under kernel-enforced restrictions — namespaces for isolation, cgroups for resource limits. An image is a layered read-only filesystem. `docker run` stacks those layers, wraps the process in namespaces and cgroups, and starts it. When the process exits, the container is done. No second kernel. No hardware emulation. Just a process with a carefully limited view of the machine it is running on.

That is all it is. For a researcher: it is a way to freeze the environment your code runs in, so that environment travels with the code — to a collaborator's machine, to a cluster, to a future you who no longer remembers what library version you were using when the result was produced.

The complexity you encounter with containers is not intrinsic to the mechanism — it is the complexity of what you're building on top of it.

