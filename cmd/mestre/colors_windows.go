//go:build windows

package main

import (
	"syscall"
	"unsafe"
)

func enableColors() {
	kernel32 := syscall.NewLazyDLL("kernel32.dll")
	getConsoleMode := kernel32.NewProc("GetConsoleMode")
	setConsoleMode := kernel32.NewProc("SetConsoleMode")
	handle, _ := syscall.GetStdHandle(syscall.STD_OUTPUT_HANDLE)
	var mode uint32
	getConsoleMode.Call(uintptr(handle), uintptr(unsafe.Pointer(&mode)))
	// ENABLE_VIRTUAL_TERMINAL_PROCESSING = 0x0004
	setConsoleMode.Call(uintptr(handle), uintptr(mode|0x0004))
}
