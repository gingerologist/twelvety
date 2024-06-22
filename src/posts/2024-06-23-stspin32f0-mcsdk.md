---
title: Hands on STEVAL-SPIN3201 and MCSDK 6
date: '2024-06-23T04:10:00+08:00'
permalink: "posts/hands-on-steval-spin3201-and-mcsdk6
---



# Hands- on STEVAL-SPIN3201 and MCSDK6



MCSDK (v6 preferred), STM32CubeMX, and STM32CubeIDE are required. Only Windows is supported by MCSDK. So the first step is to install all three software suite on Windows. MCSDK will bring up STM32CubeMX directly to generate a boilerplate project for STM32CubeIDE. Don't know whether the project could be copied to Linux and do modifications and debugging thereafter. Should be tried later.



There are tons of settings and terms in MCSDK to be clarified. And first of all, I need to figure out the meaning of all parameters for motor.



> A Bug Fix
>
> There is an error when generating the source code. Something like "WARNING: Could not open/create prefs root node Software\JavaSoft\Prefs...", similar to a bug report in an irrelevant project (https://github.com/julienvollering/MIAmaxent/issues/1). 
>
> The solution
>
> It seems that the required key, SOFTWARE/JavaSoft/Prefs is properly created under 'HKEY_CURRENT_USER' instead of 'HKEY_LOCAL_MACHINE'. Creating this key will solve the problem. The reason may be "current user" instead of "everybody" is chosen when installing CubeMX.





