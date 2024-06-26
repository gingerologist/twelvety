---
title: Buildroot on STM32F469 DISCO
date: 2024-02-13
permalink: "posts/buildroot-on-stm32f469-disco.html"
---

# Board and Processor

stm32f469 discovery kit ([32F469IDISCOVERY](https://www.st.com/en/evaluation-tools/32f469idiscovery.html)) has STM32F469NIH6 on board, featuring 2Mbytes of on-chip flash and 324Kbytes on-chip sram in BGA216 package.
There are also 16MBytes sdram and 16MBytes qspi nor flash on board.

## memory mapping

According to datasheet (for fmc and quad spi, see figure 21 and table 13 in chapter 4 memory mapping of datasheet, fmc memroy banks is explained in figure 37 in reference manual).

| memory device             | addresses                 | size |
|---------------------------|---------------------------|------|
| on-chip sram              | 0x2000 0000 - 0x2002 ffff | 320K |
| on-chip flash             | 0x0800 0000 - 0x080f ffff | 2M   |
| on-board sdram (bank 1)   | 0xC000 0000 -             | 16MB |
| quadspi flash (bank 1)    | 0x9000 0000 -             | 16MB |


> for fmc, bank 1 is NOR/PSRAM/SRAM, bank 2 reserved, bank 3 is NAND, bank 4 is reserved, bank 5 is sdram bank 1,
> bank 6 is sdram bank 2; for disco board, the bank number can be checked in ide (ioc).

In flash linker file
```
/* Memories definition */
MEMORY
{
  CCMRAM  (xrw)   : ORIGIN = 0x10000000,   LENGTH =   64K
  RAM     (xrw)   : ORIGIN = 0x20000000,   LENGTH =  320K
  FLASH   (xr )   : ORIGIN = 0x08000000,   LENGTH = 2048K
}
```

# Comparison of Buildroot Configs

## tools and docs

```
$ ll board/stmicroelectronics/stm32f469-disco/
total 36
drwxrwxr-x 1 ma ma  236 Feb 13 14:19 ./
drwxrwxr-x 1 ma ma  162 Jan 15 18:21 ../
-rw-rw-r-- 1 ma ma  206 Jan 15 18:21 extlinux.conf
-rwxrwxr-x 1 ma ma  415 Jan 15 18:21 flash_sd.sh*
-rwxrwxr-x 1 ma ma  583 Jan 15 18:21 flash_xip.sh*
-rw-rw-r-- 1 ma ma  303 Jan 15 18:21 genimage.cfg
-rw-rw-r-- 1 ma ma  164 Jan 15 18:21 linux-sd.fragment
-rw-rw-r-- 1 ma ma 3333 Jan 15 18:21 linux-xip.config
-rwxrwxr-x 1 ma ma  118 Jan 15 18:21 post-build.sh*
-rw-rw-r-- 1 ma ma 1226 Jan 15 18:21 readme.txt
-rw-rw-r-- 1 ma ma  559 Jan 15 18:21 readme_xip.txt
```

## sd config

- kernel version 5.14.12
- kernel config
  - stm32_defconfig (`output/build/linux-5.14.12/arch/arm/configs/stm32_defconfig`)
  - `output/build/linux-5.14.12/arch/arm/configs/dram_0x00000000.config` set dram base address.
  - `board/stmicroelectronics/stm32f469-disco/linux-sd.fragment` see below
- output zImage
- ext2 rootfs, 32MB
- u-boot

### `configs/stm32f469_disco_sd_defconfig`

```
BR2_arm=y
BR2_cortex_m4=y
BR2_PACKAGE_HOST_LINUX_HEADERS_CUSTOM_5_14=y
BR2_ROOTFS_POST_BUILD_SCRIPT="board/stmicroelectronics/common/stm32f4xx/stm32-post-build.sh board/stmicroelectronics/stm32f469-disco/post-build.sh"
BR2_ROOTFS_POST_IMAGE_SCRIPT="support/scripts/genimage.sh"
BR2_ROOTFS_POST_SCRIPT_ARGS="-c board/stmicroelectronics/stm32f469-disco/genimage.cfg"
BR2_LINUX_KERNEL=y
BR2_LINUX_KERNEL_CUSTOM_VERSION=y
BR2_LINUX_KERNEL_CUSTOM_VERSION_VALUE="5.14.12"
BR2_LINUX_KERNEL_DEFCONFIG="stm32"
BR2_LINUX_KERNEL_CONFIG_FRAGMENT_FILES="$(LINUX_DIR)/arch/arm/configs/dram_0x00000000.config board/stmicroelectronics/stm32f469-disco/linux-sd.fragment"
BR2_LINUX_KERNEL_IMAGE_TARGET_CUSTOM=y
BR2_LINUX_KERNEL_IMAGE_TARGET_NAME="zImage"
BR2_LINUX_KERNEL_DTS_SUPPORT=y
BR2_LINUX_KERNEL_INTREE_DTS_NAME="stm32f469-disco"
BR2_PACKAGE_BUSYBOX_CONFIG="package/busybox/busybox-minimal.config"
BR2_PACKAGE_BUSYBOX_CONFIG_FRAGMENT_FILES="board/stmicroelectronics/common/stm32f4xx/busybox.fragment"
# BR2_PACKAGE_IFUPDOWN_SCRIPTS is not set
BR2_TARGET_ROOTFS_EXT2=y
BR2_TARGET_ROOTFS_EXT2_SIZE="32M"
# BR2_TARGET_ROOTFS_TAR is not set
BR2_TARGET_UBOOT=y
BR2_TARGET_UBOOT_BUILD_SYSTEM_KCONFIG=y
BR2_TARGET_UBOOT_CUSTOM_VERSION=y
BR2_TARGET_UBOOT_CUSTOM_VERSION_VALUE="2023.04"
BR2_TARGET_UBOOT_BOARD_DEFCONFIG="stm32f469-discovery"
BR2_TARGET_UBOOT_NEEDS_OPENSSL=y
BR2_PACKAGE_HOST_DOSFSTOOLS=y
BR2_PACKAGE_HOST_GENIMAGE=y
BR2_PACKAGE_HOST_MTOOLS=y
BR2_PACKAGE_HOST_OPENOCD=y
```

### `board/stmicroelectronics/stm32f469-disco/linux-sd.fragment`

```
# CONFIG_XIP_KERNEL is not set
CONFIG_DRM=y
CONFIG_DRM_STM=y
CONFIG_DRM_STM_DSI=y
CONFIG_DRM_PANEL_ORISETECH_OTM8009A=y
CONFIG_FB=y
CONFIG_BACKLIGHT_CLASS_DEVICE=y
```

## xip config

- kernel version 5.15.6
- dedicated kernel config `board/stmicroelectronics/stm32f469-disco/linux-xip.config`
- output xipImage
- initramfs rootfs
- afboot

### `configs/stm32f469_disco_sd_defconfig`

```
BR2_arm=y
BR2_cortex_m4=y
BR2_KERNEL_HEADERS_5_15=y
# BR2_UCLIBC_INSTALL_UTILS is not set
BR2_ENABLE_LTO=y
BR2_ROOTFS_POST_BUILD_SCRIPT="board/stmicroelectronics/common/stm32f4xx/stm32-post-build.sh"
BR2_LINUX_KERNEL=y
BR2_LINUX_KERNEL_CUSTOM_VERSION=y
BR2_LINUX_KERNEL_CUSTOM_VERSION_VALUE="5.15.6"
BR2_LINUX_KERNEL_USE_CUSTOM_CONFIG=y
BR2_LINUX_KERNEL_CUSTOM_CONFIG_FILE="board/stmicroelectronics/stm32f469-disco/linux-xip.config"
BR2_LINUX_KERNEL_IMAGE_TARGET_CUSTOM=y
BR2_LINUX_KERNEL_IMAGE_TARGET_NAME="xipImage"
BR2_LINUX_KERNEL_DTS_SUPPORT=y
BR2_LINUX_KERNEL_INTREE_DTS_NAME="stm32f469-disco"
BR2_PACKAGE_BUSYBOX_CONFIG="package/busybox/busybox-minimal.config"
BR2_PACKAGE_BUSYBOX_CONFIG_FRAGMENT_FILES="board/stmicroelectronics/common/stm32f4xx/busybox.fragment"
# BR2_PACKAGE_IFUPDOWN_SCRIPTS is not set
BR2_TARGET_ROOTFS_INITRAMFS=y
# BR2_TARGET_ROOTFS_TAR is not set
BR2_TARGET_AFBOOT_STM32=y
BR2_TARGET_AFBOOT_STM32_KERNEL_ADDR=0x0800C000
BR2_PACKAGE_HOST_OPENOCD=y
```

### `make linux-menuconfig`

The following xip related options are set
```
XIP_KERNEL
XIP_DEFLATED_DATA (Boot options -> Store kernel .data section compressed in ROM)
XIP_PHYS_ADDR [=0x0800C000]     -> XIP Kernel Physical Location
```

### kernel image

According to build log, the kernel has been built twice. One without initramfs and the other with. The final xipImage has 1,659,451 bytes.

### memory usage

```
~ # cat /proc/meminfo
MemTotal:          16016 kB
MemFree:           11776 kB
MemAvailable:      11024 kB
Buffers:               0 kB
Cached:             1184 kB
SwapCached:            0 kB
Active:                0 kB
Inactive:              0 kB
Active(anon):          0 kB
Inactive(anon):        0 kB
Active(file):          0 kB
Inactive(file):        0 kB
Unevictable:        1140 kB
Mlocked:               0 kB
MmapCopy:           1164 kB
SwapTotal:             0 kB
SwapFree:              0 kB
Dirty:                 0 kB
Writeback:             0 kB
AnonPages:             0 kB
Mapped:                0 kB
Shmem:                 0 kB
KReclaimable:          0 kB
Slab:               1696 kB
SReclaimable:          0 kB
SUnreclaim:         1696 kB
KernelStack:         176 kB
PageTables:            0 kB
NFS_Unstable:          0 kB
Bounce:                0 kB
WritebackTmp:          0 kB
CommitLimit:        8008 kB
Committed_AS:          0 kB
VmallocTotal:          0 kB
VmallocUsed:           0 kB
VmallocChunk:          0 kB
Percpu:               32 kB
```

# roadmap

- [ ] quadspi kernel xip

# open question

- is it possible to xip initramfs directly?
- is axfs a better choice than cramfs/initrd?

# quadspi kernel xip

objective: 
- useful when migrating to MCU without much on-chip flash, such as stm32h7b0.
- modify afboot

## MS #1 Place xipImage, dtb on QSPI flash

dtb location: `0x90004000`
kernel location: `0x9000C000`

### afboot

- `3566acd` is the latest commit (7 years ago)
- all 3 patches are compile/linker option related, no code patched
- the last commit supports qspi flash

If kernel and dtb moved to qspi flash, the following config should be redefined.
- `BR2_TARGET_AFBOOT_STM32_KERNEL_ADDR` change to 0x9000 C000, currently 0x0800C000
- `BR2_TARGET_AFBOOT_STM32_DTB_ADDR` change to 0x9000 4000, currently 0x08004000

### kernel config

`Boot options -> `
- `-> Kernel Execute-In-Place from ROM` (`XIP_KERNEL` already set)
- `-> (0xNNNNNNNN) XIP Kernel Physical Location` (`XIP_PHYS_ADDR` `0x0800C000` -> `0x9000C000`)

```shell
rm -rf output/build/afboot-stm32-....
make menuconfig # change afboot settings
make
```

flash three files, afboot, xipImage, and dtb file, using stm32cube programmer. Reset to get the following boot log.

Noticing that it takes substantial amount of time, may be due to the slow quad spi interface and no cpu cache.

```
.** 2 printk messages dropped **
[    0.000000] CPU: ARMv7-M [410fc241] revision 1 (ARMv7M), cr=00000000
[    0.000000] CPU: unknown data cache, unknown instruction cache
[    0.000000] OF: fdt: Machine model: STMicroelectronics STM32F469i-DISCO board
[    0.000000] Zone ranges:
[    0.000000]   Normal   [mem 0x0000000000000000-0x0000000000ffffff]
[    0.000000] Movable zone start for each node
[    0.000000] Early memory node ranges
[    0.000000]   node   0: [mem 0x0000000000000000-0x0000000000ffffff]
[    0.000000] Initmem setup node 0 [mem 0x0000000000000000-0x0000000000ffffff]
[    0.000000] pcpu-alloc: s0 r0 d32768 u32768 alloc=1*32768
[    0.000000] pcpu-alloc: [0] 0 
[    0.000000] Built 1 zonelists, mobility grouping off.  Total pages: 4064
[    0.000000] Kernel command line: root=/dev/ram
[    0.000000] Dentry cache hash table entries: 2048 (order: 1, 8192 bytes, linear)
[    0.000000] Inode-cache hash table entries: 1024 (order: 0, 4096 bytes, linear)
[    0.000000] mem auto-init: stack:all(zero), heap alloc:off, heap free:off
[    0.000000] Memory: 16000K/16384K available (911K kernel code, 74K rwdata, 184K rodata, 60K init, 45K bss, 384K reserved, 0K cma-reserved)
[    0.000000] rcu: Preemptible hierarchical RCU implementation.
[    0.000000]  Trampoline variant of Tasks RCU enabled.
[    0.000000] rcu: RCU calculated value of scheduler-enlistment delay is 100 jiffies.
[    0.000000] NR_IRQS: 16, nr_irqs: 16, preallocated irqs: 16
[    0.000000] /soc/interrupt-controller@40013c00: bank0
[    0.000000] clocksource: arm_system_timer: mask: 0xffffff max_cycles: 0xffffff, max_idle_ns: 331816030 ns
[    0.000000] ARM System timer initialized as clocksource
[    0.000041] sched_clock: 32 bits at 90MHz, resolution 11ns, wraps every 23860929530ns
[    0.001848] timer@40000c00: STM32 sched_clock registered
[    0.003435] Switching to timer-based delay loop, resolution 11ns
[    0.004577] timer@40000c00: STM32 delay timer registered
[    0.005990] clocksource: timer@40000c00: mask: 0xffffffff max_cycles: 0xffffffff, max_idle_ns: 21236227187 ns
[    0.008210] /soc/timer@40000c00: STM32 clockevent driver initialized (32 bits)
[    0.042100] Calibrating delay loop (skipped), value calculated using timer frequency.. 180.00 BogoMIPS (lpj=90000)
[    0.044916] pid_max: default: 4096 minimum: 301
[    0.050721] Mount-cache hash table entries: 1024 (order: 0, 4096 bytes, linear)
[    0.053397] Mountpoint-cache hash table entries: 1024 (order: 0, 4096 bytes, linear)
[    0.139149] rcu: Hierarchical SRCU implementation.
[    0.160864] devtmpfs: initialized
[    0.356491] random: fast init done
[    2.101712] clocksource: jiffies: mask: 0xffffffff max_cycles: 0xffffffff, max_idle_ns: 1911260446275000 ns
[    2.105858] pinctrl core: initialized pinctrl subsystem
[    2.421146] random: get_random_bytes called from 0x901224d3 with crng_init=1
[    3.939174] platform 40016c00.dsi: Fixing up cyclic dependency with 40016800.display-controller
[    4.175975] stm32f469-pinctrl soc:pin-controller@40020000: No package detected, use default one
[    4.358850] stm32f469-pinctrl soc:pin-controller@40020000: GPIOA bank added
[    4.410246] stm32f469-pinctrl soc:pin-controller@40020000: GPIOB bank added
[    4.445803] stm32f469-pinctrl soc:pin-controller@40020000: GPIOC bank added
[    4.515676] stm32f469-pinctrl soc:pin-controller@40020000: GPIOD bank added
[    4.570251] stm32f469-pinctrl soc:pin-controller@40020000: GPIOE bank added
[    4.621455] stm32f469-pinctrl soc:pin-controller@40020000: GPIOF bank added
[    4.692774] stm32f469-pinctrl soc:pin-controller@40020000: GPIOG bank added
[    4.727079] stm32f469-pinctrl soc:pin-controller@40020000: GPIOH bank added
[    4.797455] stm32f469-pinctrl soc:pin-controller@40020000: GPIOI bank added
[    4.833207] stm32f469-pinctrl soc:pin-controller@40020000: GPIOJ bank added
[    4.883646] stm32f469-pinctrl soc:pin-controller@40020000: GPIOK bank added
[    4.887078] stm32f469-pinctrl soc:pin-controller@40020000: Pinctrl STM32 initialized
[    6.089927] stm32-dma 40026000.dma-controller: STM32 DMA driver registered
[    6.326924] stm32-dma 40026400.dma-controller: STM32 DMA driver registered
[    6.441899] clocksource: Switched to clocksource timer@40000c00
[    6.811325] workingset: timestamp_bits=30 max_order=12 bucket_order=0
[    7.254555] STM32 USART driver initialized
[    7.534376] 40004800.serial: ttySTM0 at MMIO 0x40004800 (irq = 32, base_baud = 2812500) is a stm32-usart
[    8.567628] printk: console [ttySTM0] enabled
[    8.918710] random: crng init done
[   10.021639] stm32_rtc 40002800.rtc: registered as rtc0
[   10.056665] stm32_rtc 40002800.rtc: setting system clock to 2000-01-01T08:21:06 UTC (946714866)
[   10.126559] stm32_rtc 40002800.rtc: Date/Time must be initialized
[   15.429705] Freeing unused kernel image (initmem) memory: 16K
[   15.438323] This architecture does not have kernel memory protection.
[   15.447463] Run /init as init process
[   15.453354]   with arguments:
[   15.458525]     /init
[   15.462429]   with environment:
[   15.467443]     HOME=/
[   15.471439]     TERM=linux
seedrng: can't determine pool size, assuming 256 bits: No such file or directory
Saving 256 bits of creditable seed for next boot

Welcome to Buildroot
(none) login:
```

## MS#2 Try CRAMFS initrd

https://microchip.my.site.com/s/article/What-are-the-prerequisites-to-use-cramfs-root-filesystem

cramfs is usually configured as a mtd partition, and picked as rootfs in bootargs using "root=mtd:xxxx" grammar. However, in this way, both quadspi and mtd driver should be provided in kernel, If my understanding is correct. In the above link, microchip provides another method using cramfs rootfs. Putting cramfs somewhere in memory (address space), then use initrd bootarg grammar "init=addr,size". 

In the example microchip also add a ramdisk_size parameter. This is susceptible since it is a block layer argument. We will examine whether it is really required.

### dts

in chosen node
```
- bootargs = "root=/dev/ram";
+ bootargs = "root=mtd:rootfs ro";
```

add the following description after memory@0 node

```
	flash@0 {
		compatible = "mtd-rom";
		reg = <0x90800000 0x800000>;
		bank-width = <4>;
		#address-cells = <1>;
		#size-cells = <1>;
		partition@0 {
			label = "rootfs";
			reg = <0 0x800000>;
		};
	};
```

### kernel config

1. enable cramfs (in misc file system)
2. In General Setup, remove Initramfs source file(s) `INITRAMFS_SOURCE`
3. In dts file, chosen cell, set 

```
bootargs = "root=/dev/ram0 init=0x90800000,0x00800000"
```

### buildroot menuconfig

in Filesystem images
1. uncheck initial RAM filesystem linked into linux kernel
2. uncheck cpio the root file system
3. check cramfs root filesystem
4. check support XIP of all ELF files

temp
- remove block
- restore POSIX_TIMERS//
- DRAM_BASE 0x00000000 without these settings the memory node in dt file has no effect.
- DRAM_SIZE 0x00800000

succeptible
CONFIG_MTD_PHYSMAP_VERSATILE=y not necessary! tested.


```diff
--- board/stmicroelectronics/stm32f469-disco/linux-xip.config.orig	2024-02-16 02:18:28.114550404 +0800
+++ board/stmicroelectronics/stm32f469-disco/linux-xip.config	2024-02-15 05:03:30.856182293 +0800
@@ -1,24 +1,13 @@
 # CONFIG_LOCALVERSION_AUTO is not set
-CONFIG_KERNEL_XZ=y
 CONFIG_NO_HZ_IDLE=y
 CONFIG_HIGH_RES_TIMERS=y
 CONFIG_PREEMPT=y
 CONFIG_LOG_BUF_SHIFT=12
 CONFIG_PRINTK_SAFE_LOG_BUF_SHIFT=10
-CONFIG_BLK_DEV_INITRD=y
-CONFIG_INITRAMFS_SOURCE="${BR_BINARIES_DIR}/rootfs.cpio"
-# CONFIG_RD_GZIP is not set
-# CONFIG_RD_BZIP2 is not set
-# CONFIG_RD_LZMA is not set
-# CONFIG_RD_XZ is not set
-# CONFIG_RD_LZO is not set
-# CONFIG_RD_LZ4 is not set
-# CONFIG_RD_ZSTD is not set
 CONFIG_CC_OPTIMIZE_FOR_SIZE=y
 # CONFIG_MULTIUSER is not set
 # CONFIG_SYSFS_SYSCALL is not set
 # CONFIG_FHANDLE is not set
-CONFIG_POSIX_TIMERS=y
 # CONFIG_BUG is not set
 # CONFIG_BASE_FULL is not set
 # CONFIG_FUTEX is not set
@@ -48,11 +37,11 @@
 # CONFIG_ARM_DMA_MEM_BUFFERABLE is not set
 CONFIG_SET_MEM_PARAM=y
 CONFIG_DRAM_BASE=0x00000000
-CONFIG_DRAM_SIZE=0x00800000
+CONFIG_DRAM_SIZE=0x01000000
 CONFIG_HZ_1000=y
 # CONFIG_ATAGS is not set
 CONFIG_XIP_KERNEL=y
-CONFIG_XIP_PHYS_ADDR=0x0800C000
+CONFIG_XIP_PHYS_ADDR=0x90010000
 CONFIG_XIP_DEFLATED_DATA=y
 # CONFIG_SUSPEND is not set
 # CONFIG_STACKPROTECTOR is not set
@@ -68,6 +57,10 @@
 # CONFIG_PREVENT_FIRMWARE_BUILD is not set
 # CONFIG_FW_LOADER is not set
 # CONFIG_ALLOW_DEV_COREDUMP is not set
+CONFIG_MTD=y
+CONFIG_MTD_ROM=y
+CONFIG_MTD_PHYSMAP=y
+CONFIG_MTD_PHYSMAP_OF=y
 CONFIG_EEPROM_93CX6=y
 # CONFIG_INPUT is not set
 # CONFIG_VT is not set
@@ -104,7 +97,7 @@
 # CONFIG_INOTIFY_USER is not set
 # CONFIG_PROC_SYSCTL is not set
 CONFIG_CONFIGFS_FS=y
-# CONFIG_MISC_FILESYSTEMS is not set
+CONFIG_CRAMFS=y
 CONFIG_NLS=y
 CONFIG_PRINTK_TIME=y
 CONFIG_CONSOLE_LOGLEVEL_DEFAULT=15
```

1. `-CONFIG_POSIX_TIMERS=y` is here possibly caused by default setting in kernel 5.15.6
2. `CONFIG_CRAMFS_MTD=y` will be *automatically* selected when `MISC_FILESYSTEMS [=y] && CRAMFS [=y] && CRAMFS [=y]<=MTD [=y]`


- remove initramfs setting
- CONFIG_POSIX_TIMERS is default
- CONFIG_SET_MEM_PARAM, CONFIG_DRAM_BASE, and CONFIG_DRAM_SIZE should be set. Otherwise mem size defaults to 8M and dt memory node has no effect.
- change XIP_PHYS_ADDR to point to QSPI instead of on-chip flash.
- CONFIG_MTD and CONFIG_MTD_PHYSMAP are the keys to map hardware memory-mapped flash in kernel. 
   1. see mtd-physmap.txt in kernel doc. there are several choices such as cfi-flash, jedec-flash, mtd-ram and mtd-rom.
   2. the mtd-rom is most appropriate. *flashes are not for the probe function could be called and it won't succeed.
- add cramfs support and CRAMFS_MTD is important. This allows skipping block layer as well as XIP. see cramfs.txt in kernel doc for further detail.

```diff
--- output/build/linux-5.15.6/arch/arm/boot/dts/stm32f469-disco.dts	2024-02-16 04:00:01.778993440 +0800
+++ board/stmicroelectronics/stm32f469-disco/stm32f469-disco.dts	2024-02-16 04:00:39.080171093 +0800
@@ -56,7 +56,7 @@
 	compatible = "st,stm32f469i-disco", "st,stm32f469";
 
 	chosen {
-		bootargs = "root=/dev/ram";
+		bootargs = "root=mtd:rootfs ro";
 		stdout-path = "serial0:115200n8";
 	};
 
@@ -65,6 +65,18 @@
 		reg = <0x00000000 0x1000000>;
 	};
 
+	flash@0 {
+		compatible = "mtd-rom";
+		reg = <0x90800000 0x800000>;
+		bank-width = <4>;
+		#address-cells = <1>;
+		#size-cells = <1>;
+		partition@0 {
+			label = "rootfs";
+			reg = <0 0x800000>;
+		};
+	};
+
 	aliases {
 		serial0 = &usart3;
 	};
```

boot log:

```
.** 2 printk messages dropped **
[    0.000000] CPU: ARMv7-M [410fc241] revision 1 (ARMv7M), cr=00000000
[    0.000000] CPU: unknown data cache, unknown instruction cache
[    0.000000] OF: fdt: Machine model: STMicroelectronics STM32F469i-DISCO board
[    0.000000] Zone ranges:
[    0.000000]   Normal   [mem 0x0000000000000000-0x0000000000ffffff]
[    0.000000] Movable zone start for each node
[    0.000000] Early memory node ranges
[    0.000000]   node   0: [mem 0x0000000000000000-0x0000000000ffffff]
[    0.000000] Initmem setup node 0 [mem 0x0000000000000000-0x0000000000ffffff]
[    0.000000] pcpu-alloc: s0 r0 d32768 u32768 alloc=1*32768
[    0.000000] pcpu-alloc: [0] 0 
[    0.000000] Built 1 zonelists, mobility grouping off.  Total pages: 4064
[    0.000000] Kernel command line: root=mtd:rootfs ro
[    0.000000] Dentry cache hash table entries: 2048 (order: 1, 8192 bytes, linear)
[    0.000000] Inode-cache hash table entries: 1024 (order: 0, 4096 bytes, linear)
[    0.000000] mem auto-init: stack:all(zero), heap alloc:off, heap free:off
[    0.000000] Memory: 16000K/16384K available (932K kernel code, 74K rwdata, 188K rodata, 57K init, 45K bss, 384K reserved, 0K cma-reserved)
[    0.000000] rcu: Preemptible hierarchical RCU implementation.
[    0.000000]  Trampoline variant of Tasks RCU enabled.
[    0.000000] rcu: RCU calculated value of scheduler-enlistment delay is 100 jiffies.
[    0.000000] NR_IRQS: 16, nr_irqs: 16, preallocated irqs: 16
[    0.000000] /soc/interrupt-controller@40013c00: bank0
[    0.000000] clocksource: arm_system_timer: mask: 0xffffff max_cycles: 0xffffff, max_idle_ns: 331816030 ns
[    0.000000] ARM System timer initialized as clocksource
[    0.000041] sched_clock: 32 bits at 90MHz, resolution 11ns, wraps every 23860929530ns
[    0.001848] timer@40000c00: STM32 sched_clock registered
[    0.003427] Switching to timer-based delay loop, resolution 11ns
[    0.004558] timer@40000c00: STM32 delay timer registered
[    0.005963] clocksource: timer@40000c00: mask: 0xffffffff max_cycles: 0xffffffff, max_idle_ns: 21236227187 ns
[    0.008182] /soc/timer@40000c00: STM32 clockevent driver initialized (32 bits)
[    0.042313] Calibrating delay loop (skipped), value calculated using timer frequency.. 180.00 BogoMIPS (lpj=90000)
[    0.045130] pid_max: default: 4096 minimum: 301
[    0.050936] Mount-cache hash table entries: 1024 (order: 0, 4096 bytes, linear)
[    0.053614] Mountpoint-cache hash table entries: 1024 (order: 0, 4096 bytes, linear)
[    0.139360] rcu: Hierarchical SRCU implementation.
[    0.161072] devtmpfs: initialized
[    0.356700] random: fast init done
[    2.134832] clocksource: jiffies: mask: 0xffffffff max_cycles: 0xffffffff, max_idle_ns: 1911260446275000 ns
[    2.138868] pinctrl core: initialized pinctrl subsystem
[    2.443379] random: get_random_bytes called from 0x9012bccb with crng_init=1
[    4.006806] platform 40016c00.dsi: Fixing up cyclic dependency with 40016800.display-controller
[    4.211782] stm32f469-pinctrl soc:pin-controller@40020000: No package detected, use default one
[    4.411564] stm32f469-pinctrl soc:pin-controller@40020000: GPIOA bank added
[    4.447144] stm32f469-pinctrl soc:pin-controller@40020000: GPIOB bank added
[    4.498158] stm32f469-pinctrl soc:pin-controller@40020000: GPIOC bank added
[    4.606416] stm32f469-pinctrl soc:pin-controller@40020000: GPIOD bank added
[    4.640082] stm32f469-pinctrl soc:pin-controller@40020000: GPIOE bank added
[    4.710878] stm32f469-pinctrl soc:pin-controller@40020000: GPIOF bank added
[    4.745776] stm32f469-pinctrl soc:pin-controller@40020000: GPIOG bank added
[    4.798993] stm32f469-pinctrl soc:pin-controller@40020000: GPIOH bank added
[    4.834415] stm32f469-pinctrl soc:pin-controller@40020000: GPIOI bank added
[    4.885960] stm32f469-pinctrl soc:pin-controller@40020000: GPIOJ bank added
[    4.939455] stm32f469-pinctrl soc:pin-controller@40020000: GPIOK bank added
[    4.942903] stm32f469-pinctrl soc:pin-controller@40020000: Pinctrl STM32 initialized
[    6.171281] stm32-dma 40026000.dma-controller: STM32 DMA driver registered
[    6.366406] stm32-dma 40026400.dma-controller: STM32 DMA driver registered
[    6.481515] clocksource: Switched to clocksource timer@40000c00
[    6.756684] workingset: timestamp_bits=30 max_order=12 bucket_order=0
[    6.968292] STM32 USART driver initialized
[    7.083545] 40004800.serial: ttySTM0 at MMIO 0x40004800 (irq = 32, base_baud = 2812500) is a stm32-usart
[    7.554757] printk: console [ttySTM0] enabled
[    7.721609] random: crng init done
[    8.190478] physmap-flash 90800000.flash: physmap platform flash device: [mem 0x90800000-0x90ffffff]
[    8.205612] 1 fixed-partitions partitions found on MTD device 90800000.flash
[    8.215294] Creating 1 MTD partitions on "90800000.flash":
[    8.223763] 0x000000000000-0x000000800000 : "rootfs"
[    8.456464] stm32_rtc 40002800.rtc: registered as rtc0
[    8.465495] stm32_rtc 40002800.rtc: setting system clock to 2000-01-02T14:10:52 UTC (946822252)
[    8.488325] stm32_rtc 40002800.rtc: Date/Time must be initialized
[   12.178498] cramfs: checking physical address 0x90800000 for linear cramfs image
[   12.188614] cramfs: linear cramfs image on mtd:rootfs appears to be 272 KB in size
[   12.202468] VFS: Mounted root (cramfs filesystem) readonly on device 31:0.
[   12.217707] devtmpfs: mounted
[   12.238574] Freeing unused kernel image (initmem) memory: 16K
[   12.247374] This architecture does not have kernel memory protection.
[   12.256509] Run /sbin/init as init process
[   12.263493]   with arguments:
[   12.268411]     /sbin/init
[   12.272784]   with environment:
[   12.278388]     HOME=/
[   12.282375]     TERM=linux
seedrng: can't create directory '/var/lib/seedrng': Read-only file system

Welcome to Buildroot
(none) login: 
```

memory usage

```
Welcome to Buildroot
(none) login: root
Jan  2 14:12:03 login[34]: root login on 'console'
~ # cat /proc/meminfo
MemTotal:          16016 kB
MemFree:           12532 kB
MemAvailable:      11980 kB
Buffers:               0 kB
Cached:              432 kB
SwapCached:            0 kB
Active:              352 kB
Inactive:             48 kB
Active(anon):          0 kB
Inactive(anon):        0 kB
Active(file):        352 kB
Inactive(file):       48 kB
Unevictable:          20 kB
Mlocked:               0 kB
MmapCopy:           1164 kB
SwapTotal:             0 kB
SwapFree:              0 kB
Dirty:                 0 kB
Writeback:             0 kB
AnonPages:             0 kB
Mapped:                0 kB
Shmem:                 0 kB
KReclaimable:          0 kB
Slab:               1684 kB
SReclaimable:          0 kB
SUnreclaim:         1684 kB
KernelStack:         184 kB
PageTables:            0 kB
NFS_Unstable:          0 kB
Bounce:                0 kB
WritebackTmp:          0 kB
CommitLimit:        8008 kB
Committed_AS:          0 kB
VmallocTotal:          0 kB
VmallocUsed:           0 kB
VmallocChunk:          0 kB
Percpu:               32 kB
~ #
```

Nicolas Pitre's article on lwn.net, titled [Shrinking the kernel with a hammer](https://lwn.net/Articles/748198/)

Renesas's article on ElectroniDesign [Xip with linux a new spin on embedded architecture](https://www.electronicdesign.com/technologies/embedded/article/21805857/xip-with-linux-a-new-spin-on-embedded-architecture)

eLinux's article on Application XIP, on omap, possibly outdated.
- https://elinux.org/Application_XIP
- https://elinux.org/Application_XIP_Instructions_For_OMAP

Add support for FDPIC binaries on ARM

v2 patch https://lore.kernel.org/all/20220802202142.1770838-1-Ben.Wolsieffer@hefring.com/
v3 patch https://lore.kernel.org/all/20220819151734.926106-1-Ben.Wolsieffer@hefring.com/

The review process and discussion provides some insights. Static is not supported for FDPIC. /usr/lib/ld.so.1 must
be used (for dynamic linking?)

https://lore.kernel.org/all/YyxgjEsbOShV0aQN@waldemar-brodkorb.de/

http://lists.busybox.net/pipermail/buildroot/2022-August/650134.html

https://git.buildroot.net/buildroot/patch/?id=3c207c40eb0215cb51a756f94c755e31c72d0734

what is ld.so.1 https://manpages.debian.org/testing/manpages/ld.so.8.en.html