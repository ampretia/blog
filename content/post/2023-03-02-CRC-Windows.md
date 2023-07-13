---
title: 'Running OpenShift Local on Windows'
date: '2023-03-02'
layout: post
summary: How to run OpenShift Local (Cloud Ready Containers) on Windows
tags:
    - openshift
    - wsl2
keywords:
    - openshift
    - wsl2
---

Recently had the requirement for testing within OpenShift; an cloud cluster wasn't available so enter 
RedHat OpenShift Local (or cloud ready containers)[https://freedomben.medium.com/setting-up-a-local-development-environment-for-openshift-ceaaf3d2c2d9]

Context - I run windows 11, but use WSL2 for all development. VSCode works well here, and I've run
quite happily with KIND and KS9 as a dev environment

## Run inside WSL2

TL;DR; no, couldn't get it to work; attempted steps below. Despite the output saying it had spotted WSL2 in use!

- Needs to have SystemD - but with Windows 11 and WSL2 that is resolved
- Issues with the network mode resolved with `crc config set network-mode user`
- `crc setup` works now
- `crc start` nope, there's a problem with port 6443 something else is using it (that I can't find)


## Run inside multipass VM

- No systemd

## Run inside Hyper-V Fedora VM

- Installed Fedora
- How do I get the files onto the machine, it seems that there's no CLI way to download OpenShift Local
	- after 'faffing' with host services and power shell snippets that claimed to copy to Hyper-V VMs realised that 
	  I had scp installed via OpenSSL - and a simple scp command was enough
- Configured the vm to be able to access the virtualiztion options 
```
Set-VMProcessor -VMName <VMName> -ExposeVirtualizationExtensions $true
```
- Seemed to start ok, but for some reason with the 'expandable' virtual HDD, Fedora doesn't seem to work well. 
- Ran out of disk space.

## Run on Windows directly

- Donwloaded the MSI installer
- Ran ok, rebooted, looked for an installed 'app'; none it's all CLI (fair enough)
- Run `crc setup` from elevated powershell
If you get into issues with `crc setup` stopping after the check on users, check [this issue](https://github.com/crc-org/crc/issues/2446#issuecomment-865028602)

```
$env:USERNAME="${env:USERDOMAIN}\${env:USERNAME}"
```

Its the domain prefix of the username that needs to be added.

- need a non-elevated powershell to run `crc start` and the username update 
