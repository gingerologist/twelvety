---
title: Bootstrap Zephyr with Nordic
date: '2024-06-21T21:48:00+08:00'
permalink: "posts/bootstrap-zephyr-with-nordic.html"
---



# Bootstrap Zephyr with Nordic



Nordic提供了nRF Connect SDK（NCS），其中包含Nordic官方剪裁和维护的一个Zephyr系统子集，加上Nordic自己提供的诸多工具，库，项目模板和示例代码等。



使用NCS和使用vanilla Zephyr的区别参见：www.youtube.com/watch?v=9XHcp_JOLbo



## Quick Notes



因为GFW的原因，两种方式安装都不顺利，有两个办法解决。



如果本地git从github上使用ssh下载是稳定的，但https不行，可以在git的设置文件（`~/.gitconfig`）里添加：

```
[url "ssh://git@github.com/"]
	insteadOf = https://github.com/
```

这样修改后，west update可以顺利完成下载安装。该方法对在nRF Connect for VS Code里安装toolchain无效。安装toolchain的方法入下：



on remote server:

download nrfutil according to official doc  https://docs.nordicsemi.com/bundle/nrfutil/page/guides/installing.html 

run nrfutil and install toolchain manager

using nrfutil toolchain-manager install --ncs-version v2.6.1 to install toolchain on remote server

on local machine

using rsync to pull all files to local folder, say:

```
cd ~/ncs
rsync -a root@xx.xx.xx.xx:/root/ncs/toolchains/ toolchains
```



## West

https://docs.zephyrproject.org/latest/index.html



'Developing with Zephyr' -> 'Getting Started Guide'



There are two ways to install `West`. Using virtual environment is preferred. 



For ncs, West is included in toolchain. `nrfutil toolchain-manager launch --shell` will set up a python environment with West.



