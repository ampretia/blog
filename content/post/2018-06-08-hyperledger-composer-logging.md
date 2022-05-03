---
id: 100
title: 'Hyperledger Composer &#8211; Logging'
date: '2018-06-08T14:14:06+00:00'
author: calanais
layout: post
guid: 'http://proterra.me.uk/nx01/programming/?p=100'
permalink: /2018/06/08/hyperledger-composer-logging/
tags:
    - diagnostics
    - docker
    - hyperledger-composer
    - logging
---

## Hyperledger Composer - Logging

Many years ago there was an insect that caught in a relay. Time has moved on, but the successor to that insect still can make itself known! Logging though is more than about just finding the diagnostics to help squash the specific code bugs. It can be used to see operational performance issues, spot configuration mistakes, and gaining confidence in how the code is working.

***How does Hyperledger Composer go about it's logging then?***

Firstly a link to the reference documentation on [diagnostics](https://hyperledger.github.io/composer/latest/problems/diagnostics).

Let's just first establish some terminology; there are several parts of Hyperledger Composer code.

- The smart contract - running within the Hyperledger Fabric peers, both the code user's smart contract code, and the Composer code that suports it.
- The client libraries running to interact with the smart contracts. This may be in the form of a NPM module in your own application, the Composer REST server, or a running instance of the playground. (although from a code perspective they are all instance of the client library running in an application)

We'll use the terms 'client' and 'smart-contract' to refer to the different parts - the main difference between the parts is how the output is accessed and controlled.

At various points throughout the code there are `LOG.info('Hello')` style statements that produce information. In this case the text 'Hello' will be logged with an associated *level of 'info',* as well as reference to *location* of code where this statement is.

> Note this is all based on at least the v0.19 level of composer

In summary then, both client applications and the executing smart contact code will generate logs

***What happens as standard?***

*Client*

A basic set of logging information is written out to a **.composer/logs** directory that is contained within your own home directory. There is a single file per calendar day, for example **trace\_20180426.log**

This will only store messages that are considered 'Errors' indicating something serious has happened. There is a scale of serverity for log messages, starting the most serious down to very detailed information about the system. The (decreasing) order is.

- Error
- Warn
- Info
- Verbose
- Debug

At the 'Warn' level, all messages that are considered Warnings, and Errors are reported. At the 'Debug' level everything is produced.

*Smart Contract*  
The same levels are applicable with the same meaning - the major difference being that the information is written out to the stdout, and is captured by the orchestration tools running the Fabric instances. If you're running a local development environment - this will be docker and docker-compose.

***How to control this level of information***

*Client*

The key thing is something called the debug control string; the quickest way to supply this is to use

`DEBUG=composer[debug]:* <run some application using the composer client library>`

so for example

`DEBUG=composer[debug]: composer network list`

This is an environment variable so may also be set using export

`export DEBUG=composer[debug]:`

In these examples we've used `debug` but to get less information for example

`export DEBUG=composer[info]:*`

The default setting as mentioned above is just for errors - so this is

`export DEBUG=composer[error]:*`

> Remeber that the DEBUG environment variable is a standard pattern within the node 'eco-system' so other libraries will use it. So always remember the word composer.

For example  
`export DEBUG=express:*,composer[info]:*,anotherapp:*`

*Smart Contracts*

The same control string is used as well as the same default, what is different is how this is set and queried. Rather than write to a file, the log output is sent to *stdout / stderr* of the chaincode docker container. Hence this can extracted via docker logs or by quering the output in whatever platform this is deployed on.

Control is achieved by a cli command once the network is up and running.

```
$ composer network loglevel
composer network loglevel [options]

Change the logging level of a business network
Options:
--help Show help [boolean]
-v, --version Show version number [boolean]
--newlevel, -l the new logging level [string]
--card, -c The cardname to use to change the log level the network [string] [required]

```

If run with a single --card option, the loglevel is reported back

***Controlling the locations that are logged***  
As well as the level of logging, the pieces of code that can be logged can be controlled. By placing a name instead of the \* you can log just that bit of code

```
export DEBUG=composer[info]:BusinessNetworkDefinition

```

Would just produce info level from the BusinessNetworkDefinition class. Multiple strings can be added in a comma separated list.

```
export DEBUG=composer[info]:BusinessNetworkDefinition,composer[info]:ConnectionProfileManager

```

This though requries a knowledge of the codebase to choose the various classes - so there are some synonyms available. For example

```
export DEBUG=composer[info]:AccessControl

```

Will produce information on a variety of locations of code with the intent being that they are all related to access control.

***Alternative ways to control the client***

So far we've used the env variable debug; under the covers composer is using the standard npm module config. DEBUG is a shortcut.

When you say DEBUG=.. composer converts that to the JSON structure that is picked up by the config module.

```
{  
"composer": {  
   "log": {  
    "debug": "composer[error]:*",  
    "console": {  
        "maxLevel": "none"  
    },  
    "file": {  
        "maxLevel":"silly",  
        "filename": <generated name based on date>  
        "maxsize": "1000000"  
        "maxFiles":"100"  
    }  
  }  
}  

```

The config module can be controlled directly... assuming the same JSON structure

`export NODE_CONFIG=$(cat myComposerConfig.json)`

This can be put into a file for example myComposerConfig.json and then use an environment variable to point at that file.

The **config** has a rich set of configuration, and it's a good idea to checkout the [official docs](https://www.npmjs.com/package/config). Below are some of the more common ones.

**Controlling where the client information goes**

We've covered how to achieve some level of control over the logging, and the different ways in which that control can be exercised. Now we need to look at how to have a greater level of control as to where the information goes. It's all been going to a single file so far. To do this, we'll be adjusting the JSON configuration structure. This can be set in any of the manners described.

There are two destinations for log information, FileSystem and Console. Within Smart Contracts, only the console receives information - there's no concept of a writing to a file.

Within the client, including any Composer CLI tool, the output can go to a file as well as the console. Within the file element of the JSON structure there are 4 things that can be controlled

```
"file": {  
    "maxLevel":"silly",  
    "filename": <generated name based on date>  
    "maxsize": 10000000
    "maxfiles": 100  
} 

```

The highlest level of trace point that will be written - this acts like a filter and controls what is accepted to be written to file. The debug control string says what is 'generated'. Silly is the standard (NPM) way of saying 'everything'. A good example of this would be setting the file to 'silly' to get everything, and then set the corresponding property in the console to be 'warning'. Then if the control string where `composer[debug]:*` all messages would go to the file, but only warnings and errors to the console.

Default file size is set at 10Mb, when that file is full, up to another 100 files will be written. If you get to that limit, the first file will be overwritten.

***Environment Variables Shortcut***  
There are shortcut environment variables for the filename, size and number of files.

`COMPOSER_LOGFILE` sets the name of the log file.  
`COMPOSER_LOGFILE_SIZE` sets the maximum file size  
`COMPOSER_LOGFILE_QTY` sets the maximum number of files (of the same logfile)

For the logfile names, if you include the strings `DATESTAMP``TIMESTAMP` or `PID` then they will be replaced with the datestamp, timestamp and process id respectively.

In additional there is a shortcut variable for console level control.  
`COMPOSER_LOG_CONSOLE` set this to max level to be output, none will stop all output.

***Useful References***  
The [information](https://github.com/lorenwest/node-config/wiki/Configuration-Files) on how the config module handles it's files is worth reading.

Importantly it's also worth looking at the [information](https://github.com/lorenwest/node-config/wiki/Environment-Variables) for the environment variables. Specifically look at the `NODE_CONFIG``NODE_ENV` and `NODE_CONFIG_DIR` variables

If you're running the fabric servers locally, it's useful to monitor the docker containers. `docker logs` can do this, but there's a few containers. I've found it's useful to use from like [logspout](https://github.com/gliderlabs/logspout) to monitor all the containers. Start this up first, and all the output will be available.

I've written this script that I keep handy to start this up

```
#!/bin/bash

docker start logspout || docker run -d --name="logspout" \
    --volume=/var/run/docker.sock:/var/run/docker.sock \
    --publish=127.0.0.1:8000:80 \
    gliderlabs/logspout  

curl http://127.0.0.1:8000/logs

```

## The Takeaways

- Remember the difference between client logging and the logging in the smart contract / chain code side
- `DEBUG=composer[debug]:*` will log everything
- The same control string is applicable to client side - as an enviornment varaible - or chaing code side using the `composert network log` cli command
- Client side logging will go to `<your home directory>/.composer.logs`
- Remember you own application needs to have logging as well!