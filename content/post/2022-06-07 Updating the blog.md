---
title: 'Moving from Wordpress to Static Sites'
date: '2019-07-31T15:13:52+00:00'
layout: post
summary: How I moved this from Wordpress to a static site
tags:
    - wordpress
    - hugo
    - static-sites
status: draft
---

# Migrating from Wordpress

Firstly I'm not having a 'dig' at Wordpress; the decision results from a drift between my requirements and at what Wordpress offers. It became apparent that the reason that I didn't want to update the Wordpress site was the friction with how to edit a post. In the time since it was setup, I've moved to using markdown significantly, with variety of open-source projects and CI pipelines.

I did post to twitter to seek an opinions and thanks to those you replied, and had a direct effect on this process. 

## Context

- this is a static wordpress site to a static site
- there are a few posts to move, but not a lot of commenting
- the overall format is acceptable, and no plans to change
    - plus design/css is not my primary skill set
- the whole process of new posts must be in a CI pipeline
    - edit the post in markdown
    - push to github
    - site is updated and published

## Choice of the Static Generator

I'd used Jekyll in the past, and this is mature tool that does it's job well. Though I had found that making some changes were tricky, but Jekyll was on the shortlist.

Hugo was a known tool, but hadn't used before. Written in golang, so was hoping that I didn't need to use golang templates or have to customise go code.

[Eleventy](https://www.11ty.dev/) was also on the shortlist, a new(er) tool but featured on a number of "top static-generator" posts. Maybe worth a look at.

There is also the choice of using a developer focussed platform. This is tempting and would help get traffic - but until such a point that I can get to routine of generating content decided to wait.

With [Jonathan Sanderson suggestin Hugo](https://twitter.com/jjsanderson/status/1521192033632894976) I thought I'd give it another go.


## Hugo Evaluation

The good thing about writing cli tools in a language such as Go, is that compared to say Ruby/Python/Node getting all the dependencies setup _can_ be easier. Ran through the online tutorial without issues, and pulled a suggested theme. Yes all working correctly.

So we're good to keep with Hugo. Remeber I'd used static sites before so the overall concepts were familiar.

## Theme

With design/css not being my primary skill set, for me this was the part of the process with a higher risk value. Therefore best to tackle this reasonably early.  My approach was to see if there was a theme already created that had the same overall structure as the original, and already had awareness of code formatting.

Looking over the Hugh-theme library [hugo-theme-cleanwhite](https://github.com/zhaohuabing/hugo-theme-cleanwhite) came up. Visually very similar; also contained a few nice features specifically mentioned commenting systems (more later). Structure and documentation of the code was clean and easy to follow

> Side note, that concept of the git submodule to pull in the theme I wasn't so keen on. Never had much success with managing those. Plus I wasn't quite sure how Hugo really wanted it themes, there seemed to be the themes directory, and also the top level 'css/templates directory'

## Comments

[giscus]() had mentioned the topic of porting the comments and how comments work within a static site. Giscus was mentioned in the theme, and looking at it seemed to fit quite nicely - plus with a developer focused audience requiring a github id wasn't a concern and possibly a positive point. 


## Notes on the process

### Hugo updates

### Theme updates

### Github Actions

[There is a gha](https://github.com/peaceiris/actions-hugo) from [https://twitter.com/piris314](https://twitter.com/piris314) that runs Hugo. The documetation also helpfully included a full workflow file. The publishing would have to be different of course.


### Publishing

### Comments