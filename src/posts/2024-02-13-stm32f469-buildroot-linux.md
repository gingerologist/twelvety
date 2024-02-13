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

