---
title: 'Deadlock on npm install in UBI8'
date: '2022-05-10'
layout: post
summary: "Tracking down why npm install didn't install at all"
tags:
    - npm
    - docker
    - rabbit hole
---

A *Rabbit Hole* post showing a very odd problem, the process of tracking it down and the answer. Note that none of the technology listed was actually at fault, and no rabbits were harmed.

## The Spot

When an `npm ci --only=production` was running in a [RedHat UBI8 docker image](https://www.redhat.com/en/blog/introducing-red-hat-universal-base-image), the install didn't complete. The normal constantly changing 'progress' line was completey still. No change at all giving the appearence of something deadlocked. 

Quick test on Ubuntu (that was the docker host) didn't indicate any issues. Was this an issue because of the UBI8 image? I don't use them often so less familar with their behaviour.

## The Lure

This was an environment that had to work. For demo purposes and also it can be used 'in the real world'. Plus if there was any any concern about UBI8 images that would 'be bad' for production use cases.

## The Descent into the hole

- **Reduce the test case** by copying the dockerfile and reducing it so it included just the essentials. Base image, node installation.
    - confirm that this shows the problem, it did
- **Update dependencies** node was out of date, so updated that and `npm` to the latest, no problem still there
- **Observation** that the 'hang' was always referencing some form of the network communication. 
    - Was `npm` registry up? Yes it was, confirmed by `wget`
    - But it seemd to be a different node module everytime
    - Verbose mode didn't show anything
- **Vary type trigger conditions** this was using `npm ci --only=production` what about `npm install`.. had a few dev-dependencies that I only had locally so cleared those up and out the way
    - same basic behaviour
    - was this `npm` itself?  
- **Alternatives** We've used [`pnpm`](https://pnpm.io/) before, would that work? Yes - and a lot faster better output actually.

> Pragmatics kick in here, and really need to make progress on work in progress before this, so swap to using pnpm

- **Further reduce** Could this be docker itself? This is Docker in WSL2 after all.
    - create a docker image based on Ubuntu and Node latest versions
    - simple `docker run` to map local directory into the image and test
    - the same behaviour is there, so UBI is out of the picture.

- **Networking** this is going to be something amiss with networking maybe? By why does pnpm work?

> Pragmatics again, at least this isn't UBI8. Production level issues are therefore not so much a concern. Probability is that it's a local problem. 

- **Discussion** with collegues no bright ideas, but need to reproduce the problem afresh
    - used the docker run approach now the standard way to test
    - with discussions ongoing - left the process running. If this is network then it would timeout (maybe?

- Timeout did occur, but with an address that was `172.56.78.3:4586`  (note slightly nagging that there was something familar especially the port.)
    - `172.*` addresses are local address with WSL, but it's not the address of the vm currently. 
    - try again... timeout took a lot longer, but the response from npm was useful
    - both timeouts where on the *same* npm module. So the progress 'message' wasn't an accurate reflection of the current module being located
    - Is specific to this module?

- Looking at the `npm-shrinkwrap.json` this address crops up a bit, but on an apparently random selection. No patterns, eg all dependencies on the same thing
    - delete the `npm-shrinkwrap.json` and recreate
    - check - and no 172 addresses in resolved... ah

- Re run the core test - passes. _**no problems**_.
- Ascend to the surface

## The Complete Picture

1. Earlier I had used this node module to test local changes to a node module. So a copy of [Verdaccio](https://verdaccio.org/) had been running to locally host node modules. Hence why I recognised the port number.
2. But Verdaccio caches modules as well for speed. The `npm-shrinkwrap.json` therefore was a chimera of modules pulled direct from NPM and also for ones that had been cahced by verdaccio.
3. Clearly I hadn't deleted the `npm-shrinkwrap.json` - and npm appears to not do a complete recreate of it on `npm install` this had been done a few times
4. So with these `172.*` addresses the install in the Docker didn't work.

### The still vague bits

1. Why when the `npm install` was done NOT in the docker container did those `172.*` addresses not cause problems?
2. Why was the `npm-shrinkwrap.json` not updated on new `npm install`?

# TL;DR;

In the event of odd behaviour when installing node modules, delete all shrinkwrap, package lock files and node_modules. 


