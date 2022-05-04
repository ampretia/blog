---
id: 107
title: 'Make multi-persona demos fun and interactive!'
date: '2018-06-08T15:11:05+00:00'
slug: demohats
summary: We have several demos that can be shown at conferences to customers etc. But a central feature is there have multiple web apps each driven by a different persona. How could it be possible to make the transition from one persona to another more obvious - and interactive??
layout: post
tags:
    - Node
    - Tools
---

Last week an idea occurred to me - we have several demos that can be shown at conferences to customers etc. But a central feature is there have multiple web apps (each can shown in one tab of a browser). How could it be possible to make the transition from one persona to another more obvious - and interactive??

[Demo-hats was born!](https://www.npmjs.com/package/demo-hats)

Here's the readme from the [git repo](https://github.com/ampretia/demo-hats).

- - - - - -

## Why would I use this?

- You have a web application or applications - each of which is being used by a different 'persona' or 'role'.
- You're trying to demo this at a conference, to your teammates, or your cats.
- The problem is that unless everybody is paying attention it can be quite easy to forget what UI your looking at is what persona.
- When did the 'swap' happen?
- Whose the current persona?

## Enter 'Demo-Hats'

The premise is quite simple

1. Run your application(s) however you want to.
2. Have you screen setup to demo this however you would normally.
3. *Ideally* have a second screen - maybe your laptop's own screen - that is used as a 'control'
4. *MUST* have a webcam and *MUST* have some QR codes printed out and stuck to 'something' (if you can put these on an actual hat so much the better)
5. Configure and run the 'demo-hats' application - up comes a Chrominum browser with all the applications tabs open
6. Start your demo 'speech' - when you want to swap to a persona, don't manually move the browser window but hold up a QR code instead!

> Audience should now be amazed - but that's up to your demo really 🙂

## In more detail

### Installation

It's built on node.js so you'll need that installed, then

```
npm install -g demo-hats

```

(or clone the repo!)

Create a configuration file (see below for the basic example),

Run the application

```
$ demo-hats

```

- It will open up your demo tabs.
- Open the control window (you'll be shown the URL when you run the program)
- This will ask for permission to use the webcam - say yes.
- Show it the QR codes and the tabs will change!

\*\* You must keep the Control Windows open, otherwise the webcam won't work \*\*  
\*\* But it doesn't need to have focus - just not be minimised \*\*

### Configuration

Key place to start is at the configuration - this will help you understand the whole system. Here it is - by default in a file called `hats.json`.

```
{
"info": {
"title":"People of Interest",
"summary":"Scenario showing how to show different webpages for different personas "
},
"personas": {
"alice": {
"uri": "http://localhost:3456/users/alice",
"avatar": "images/alice-person.png",
"startState": "open",
"displayName": "Alice",
"bio": "Entrepreneur. Gamer. Explorer. Pr(remember that you'll need some QR codes printed!)
},
"bob": {
"uri": "http://localhost:3456/users/bob",(remember that you'll need some QR codes printed!)
"avatar": "images/bob-person.png",
"startState": "open",
"displayName": "Matias",
"bio": "Award-winning web guru. Unapologetic food practitioner. Travel fanatic. Beer ninja. Reader."
}
}
}

```

- `info` section gives a title and a brief summary. This is shown on the control screen.
- `personas` the list of personas in use
- the key (`alice` and `bob` above) - are the phrases and words that should be encoded into the QR codes. It could be some other word, or just a letter. Up to you - but remember the more complicated the phrase the more complex the QR code.
- `uri` this is the uri that will be shown when this persona is 'activated' - i.e. the QR code is recognised... so in this case `http://localhost:3456/users/alice`, will become active and have focus. (note that the demo-hats app has a number of user pages built in for testing)
- `startState` open to say open it on start-up (to be honest this is the only option at the moment, want to add open when you see the QR code for the first time)
- `displayName` the name that will be displayed on the control screen
- `avatar` the avatar for the persona that will be displayed on the control screen
- `bio` some text that will be displayed on the controll screen.

You can have as made entries as you can have QR codes or browser tabs open.

## In use

Simply put, you keep the control window open (not minimised) but not necessarily in focus...(makes using one screen possible)  
And show it the QR code that has the encoded 'key' in it.