---
id: 183
title: 'Getting setup for development (CentOS)'
date: '2019-07-19T08:17:23+00:00'
author: calanais
layout: post
guid: 'http://proterra.me.uk/nx01/programming/?p=183'
permalink: /2019/07/19/getting-setup-for-development-centos/
categories:
    - hyperledger-fabric
    - Tools
tags:
    - CentOS
    - development
    - linux
---

At work we'll often do '[group testing' sessions or 'internal hackathons'](http://proterra.me.uk/nx01/programming/2017/06/28/tell-me-and-i-forget-teach-me-and-i-may-remember-involve-me-and-i-learn/ "group testing' sessions or 'internal hackathons'"). What struck me about the last one was that setting up your development environment can surprisingly tricky, especailly if it's for a style of development or langage you don't generally use.

> TL;DR: [gist of commands](https://gist.github.com/mbwhite/0cc46aba41569551a214827f89895eeb)

# What are we developing for?

The setup we are going for here, is a Node.js and Java environment using VSCode - with a view to using the IBM Blockchain Platform extension for writing applications and smart contracts for Hyperledger Fabric

# So how?

Well I'm going to link you to the \[github gist here\]( [gist of commands](https://gist.github.com/mbwhite/0cc46aba41569551a214827f89895eeb) "github gist here") that has the list of commands to enter, it's versioned and to have one place. Most of these commands have come from the home pages of the tools themsevles.

For me the most important elements are the programming SDK installations - using tools such as nvm, sdkman for example are critical. They allow multiple installations of language SDKs and keep things ordered

# Installing Notes

- Node.js 
  - Just use [nvm](https://github.com/nvm-sh/nvm "nvm")
- Java JDK 
  - Just use [sdkman](https://sdkman.io/ "sdkman") to install java, and specificall the AdoptOpenJDK versions of Java
- VSCode 
  - [VSCode](https://code.visualstudio.com/docs/setup/linux)
- DockerCE and docker-compose 
  - The most commands here but the Docker [website is very good](https://docs.docker.com/install/linux "website is very good")
- And some extensions for VSCode. 
  - Quite easy to install from the command line, and a bit quicker I think ```
      code --install-extension ms-vscode.vscode-typescript-tslint-plugin
      code --install-extension vscjava.vscode-java-pack
      code --install-extension ibmblockchain.ibm-blockchain-platform 
      ```