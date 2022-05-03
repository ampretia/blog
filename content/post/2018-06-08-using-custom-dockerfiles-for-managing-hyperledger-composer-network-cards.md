---
id: 104
title: 'Using custom dockerfiles for managing Hyperledger Composer Network Cards'
date: '2018-06-08T14:12:51+00:00'
author: calanais
layout: post
guid: 'http://proterra.me.uk/nx01/programming/?p=104'
permalink: /2018/06/08/using-custom-dockerfiles-for-managing-hyperledger-composer-network-cards/
tags:
    - blockchain
    - docker
    - hyperledger-composer
---

## Using Docker to help access Composer Cloud Wallets

Within a cloud application, eg a nodejs app pushed to Cloud Foundary (other clouds are available) to access a Composer Smart Contract running on Hyperledger Fabric,  
then you need the ability to store the network cards in some location that's not your laptop.

Using the 'Cloud wallets' feature it's quite easy to do this. You have the choice of S3, IBM Cloud Object Store, Cloudant, REDIS etc.  
To use one of these you need to install the relevant npm module, and then adjust the `NODE_CONFIG` setting to use it.

## Available implementations

- FileSystem based wallets are built in, as is a memory one useful for testing
- [Redis implementation](https://github.com/hyperledger/composer-tools/tree/master/packages/composer-wallet-redis)
- [IBM Cloud Object Store](https://github.com/ampretia/composer-wallet-ibmcos)
- [IBM Cloudant](https://github.com/ampretia/composer-wallet-cloudant)
- [AWS S3](https://github.com/Pop-Code/composer-wallet-s3)

## Configuration

To configure the use of these, the best way is to set the `NODE_CONFIG` environment variable and then ever app (CLI or otherwise) run in that shell will use the specified could wallet.

For sample example configurations see the set of [JSON Files](https://github.com/ampretia/composer-developer-cookbook/tree/master/configs) in the [**Composer Developer Cookbook**](https://github.com/ampretia/composer-developer-cookbook/)

To use any of these and easy way is to

```
$ export NODE_CONFIG=$(cat <path to the dir>/configs/cardstore-cwd.json)

```

If you've jq installed on your system, you can take advantage of its power to do things like

```
$ export NODE_CONFIG=$(jq .composer.wallet.options.storePath=\"$(pwd)\" <path to the dir>/configs/cardstore-dir.json)

```

To set an absolute path to the cardstore that will be located in the current directory.

## Scenario

- You've done some initial testing, and have started the smart contract on your IBP Starter Plan instance (or Fabric running on say Kuberneters somewhere)
- You've got some locally help network cards for connecting to it that you want to push into cloud storage.
- Let's assume that these are in the current working directory (extracted from say your local file system)
- You'll need to setup some form of Cloud Wallet storage - follow the setup notes per the implementation you want to use.

## Create a docker image

Grab this [dockerfile](https://github.com/ampretia/composer-developer-cookbook/tree/master/docker-containers/StarterKit-ComposerCLI) from the Composer Developer Cookbook.

This builds off the docker image that has been built for the Composer CLI, and copies in the JSON configurations we used earlier, and adds JQ.  
This isn't tied to a specific Cloud Wallet - but what you might wish to do is add in a specific ENV setting to point to your chosen cloud wallet.

Something like this (all on one line)...

```
ENV NODE_CONFIG '{"composer":{"wallet":{"type":"composer-wallet-redis","desc":"redis","options":{ "PUT_YOUR_CONFIG_SETTINGS_HERE"  }}}}'

```

Then when you build this it means that the docker image you've got will automatically go to the right place.. Though you might not wish to publish this to a public docker repo!

## Let's run this

If you've not added cutom config, then with the NODE\_CONFIG that you need for the cloud store set that to be in `CLOUD_NODE_CONFIG`

```
$ export CLOUD_NODE_CONFIG='{"composer":{"wallet":{"type":"composer-wallet-redis","desc":"redis","options":{ "PUT_YOUR_CONFIG_SETTINGS_HERE"  }}}}'

```

And then run the docker command

```
$ docker run -it -v $(pwd):/home/composer/cards --env NODE_CONFIG=${CLOUD_NODE_CONFIG} calanais/composer-cloud-card-wallet

```

Taking this apart - it mounts the current working directory that contains the cards and also sets the NODE\_CONFIG of the bash shell that will run.  
(miss out the last bit if you hard-coded this into the dockerfile)

This will put you into a BASH shell, with the environment variable set, so all `composer card` commands will use that cloud wallet.  
The cards you want to `composer card import` will be in the `./cards` directory.

Hopefully, this should make it easier to handle those cards and move them into the cloud.