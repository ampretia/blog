---
id: 64
title: 'Getting outside-in with docker-compose[r] networks'
date: '2017-11-11T18:10:59+00:00'
author: calanais
layout: post
guid: 'http://proterra.me.uk/nx01/programming/?p=64'
permalink: /2017/11/11/getting-outside-in-with-docker-composer-networks/
tags:
    - composer
    - docker
    - docker-composer
    - fabric
    - hyperledger
    - neworking
---

I had several docker containers spun up, all happily talking to each other on their own network. All happy for me to talk to them from the host Ubuntu system as well. Slight issue of when a configuration is exported from one of the docker containers, it was referring to the others by the domain it knew, `example.com` - not so great to use it from the host that knew it via localhost.

Ah, I can use `sed` to reformat the exported data - doable but not that elegant. A much more elegant solution occurred to me. Enter the /etc/hosts file

## So to recap the scenario...

We use docker and docker-composer in Composer to set up a basic Fabric system and Composer Playground for developers. Now that we [have Network Cards](http://(https://github.com/hyperledger/composer/releases/tag/v0.15.0) in the runtime and playground there's a problem how do you export a card from Playground to use on the command line?

1. Install a [Fabric/Composer](http://(https://hyperledger.github.io/composer/installing/using-playground-locally.html)set up directly.If you want to do this now it's the command

```
<pre class="lang:sh decode:true">curl -sSL https://hyperledger.github.io/composer/install-hlfv1.sh | bash
```

1. This spins up a set of docker images that make up a simple Hyperledger Fabric - and also starts the Composer playground and brings this up in your browser.
2. But as a developer you want to access this also from command line applications. You then install the composer-cli  
  <span class="lang:sh decode:true crayon-inline ">npm install -g composer-cli</span>
3. Exporting a Network Card form playground is great, until you come to then use it for real

```
<pre class="lang:sh decode:true">$ composer card import --file ~/Downloads/admin.com
Successfully imported business network card: admin@bond-network

Command succeeded

$ composer network list --card admin@bond-network
# uh-oh..... can't connect
```

This is because from your host command line, the example.com hosts that are used in docker-composer network - don't mean much from your host system.

## Solution

**Edit /etc/hosts so that the exmaple.com host names resolve to localhost**

- Rather than edit by hand, I came across[ hostess](https://github.com/cbednarski/hostess) - a simple command line that edits the /etc/hosts
- Download this from the github repo
- <span class="lang:sh decode:true crayon-inline ">chmod u+x hostesss\_linux\_amd64</span> to make it executable
- <span class="lang:js decode:true crayon-inline ">sudo mv hostess\_linux\_amd64 /usr/local/bin/hostess</span> to put it on the path and give a simpler name
- This now makes it very easy to add and remove and list entries from the /etc/hosts file.
- So as this is was to make it easy to use the docker hosted version of the Hyperleder Composer Playground here's the json file that contains the extra entries

```
<pre class="lang:js decode:true">[
   {
      "domain": "ca.org1.example.com",
      "ip": "127.0.0.1",
      "enabled": true
   },
   {
       "domain": "orderer.example.com",
       "ip": "127.0.0.1",
       "enabled": true
    },
    {
       "domain": "peer0.org1.example.com",
       "ip": "127.0.0.1",
       "enabled": true
    }
]
```

- Copy this to a simple text file named say <span class="lang:sh decode:true crayon-inline ">fabrichosts.json</span>
- Run the hostess tool to import these
- <span class="lang:sh decode:true crayon-inline ">hostess apply fabrichosts.json</span>

That's it.

What this means is that from the docker-hosted version of the Composer playground, Network Cards can be exported that refer to the `example.com` address - but they can be used from the command line with ease!