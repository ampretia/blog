---
id: 178
title: 'Windows, Virtual Box, and CentOS'
date: '2019-07-19T07:58:02+00:00'
author: calanais
layout: post
guid: 'http://proterra.me.uk/nx01/programming/?p=178'
permalink: /2019/07/19/windows-virtual-box-and-centos/
tags:
    - CentOS
    - Installing
    - VirtualBox
---

My *personal preference* for developing is to use Windows 10 as my laptops main OS, but then run VirtualBox with Linux. Succiently this is because

- I like to have office style applications available, and as a general 'just do stuff' Windows does the job well
- Should something go wrong developing, it's quite easy to through the VM away and start again. Or if you want to test a certain machine configuration.

To date I've used Ubuntu as the Linux OS; but thought I'd try CentOS 7 - wasn't quite as slick if I'm honest. Few gotchas so here's some notes if needed.

> TL;DR; To be fair the problems where caused by a known issue in the CentOS implementation that is documented in the notes in Virtual Box releases notes, forums and RedHat website. As is solveable if update the OS as soon as it's installed.

## Notes

- I used Virtual Box v6, ensure that you create the VM specifing that CentOS is your target os
- Generally I give 4 virtual cores
- Disk space 100Gb is plenty
- You can get issues with the mouse not working so ensure that you have selected USB Tablet' in the Pointing Device dropdown (in settings look for System -> Motherboard )
- When installing CentOS few critical things I found.. was make sure that the network is connected; makes things a lot easier
- I insalled the GNOME environment, and the Developer Packs (though next time I may miss the developer pack as it puts on some quite old packages)

**This is where trouble started**  
Well after starting up, discovered that only the first click of the mouse in an app worked. This is a [well known bug](https://forums.virtualbox.org/viewtopic.php?f=3&t=90267&sid=64fba15aeafd4c761137a367e1bb8bd1&start=105)...

What I forget to do when first installed, was to run `sudo yum update`.... that installs the kernal patches. Reboot, and things are fixed.

Then install the Virtual Box Extensions... **and then all is well.**

**Do not...**

- Update the kernal to v 4.4 to try and fix the problem, as the Virtual Box Extensions don't work with that.
- Try and fix that compile bug that occurs when installing those extensions
- try and swap to using KDE as the original GNOME desktop took away so much with task bars