---
title: 'Github actions, Python and yq Rabbit Hole'
date: '2022-05-10'
layout: post
draft: true
summary: Solving the issue of mysterious version of yq
tags:
    - yq
    - rabbit hole
---

A 'rabbit hole' post...

- Starting point was a github actions workflow failing - specifically it was failing in the test phase, and repeatdly over a couple of days.  Checking logs, and looking for possible exceptions error, didn't reveal anything obvious - the failures weren't consistent. 

- These test runs in effect are a client application talking to a cloud service. No errors in the cloud service. But these client tests I can run locally myself to see what the errors really are

- 