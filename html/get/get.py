#!/usr/bin/env python3

import json
import psutil
import time

# object that represents one measurement that has been done
class Measure:

    def __init__ (self, title, value):
        self.title = title
        self.value = value

# function that calculates the average of a list of numbers
# input can be either 1 list object or multiple numbers
def avg (*l):
    if isinstance(l[0], list):
        l = l[0]
    return sum(l) / len(l)

# returns the cpu usage times from last boot as a list of properties
def measure_cpu ():
    dat = [entry.system + entry.user for entry in psutil.cpu_times(True)]
    return [ Measure('cpu_times_total', avg(dat)),
             Measure('cpu_times_cores', dat) ]

# return the RAM usage of all of the system, put into different categories
# these are the same categories as returned by default by psutil on a linux
#   machine
def measure_ram ():
    dat = psutil.virtual_memory()
    return [ Measure('ram_total', dat.total),
             Measure('ram_available', dat.available),
             Measure('ram_used', dat.used), 
             Measure('ram_free', dat.free), 
             Measure('ram_buffers', dat.buffers), 
             Measure('ram_cached', dat.cached), 
             Measure('ram_shared', dat.shared), 
             Measure('ram_slab', dat.slab) ]

# get the current timestamp as a measurement
def measure_time ():
    return [ Measure('timestamp', time.time()) ]

# get hardware information of the raspberry pi
def measure_hardware_info ():
    f = open('/proc/cpuinfo', 'r')
    model = 'N/A'
    for line in f.readlines():
        if line.startswith('Model\t'):
            model = line.replace('Model\t', '')
            model = model.replace('\t', '')
            model = model.split(' ')
            model = model[3] + model[5]
    return [ Measure('model', model) ]

# measure the CPU temperature of the pi
def measure_temp ():
    temp = open('/sys/class/thermal/thermal_zone0/temp', 'r').readline()
    temp = float(temp) / 1000
    return [ Measure('temp_cpu', temp) ]

# returns measurements based on connection types
# 2 types are being checked: wifi and ethernet
def measure_connection ():
    wlan = open('/sys/class/net/wlan0/operstate', 'r').readline()
    eth = open('/sys/class/net/eth0/operstate', 'r').readline()
    return [ Measure('connection_wlan', wlan.startswith('up')),
             Measure('connection_eth', eth.startswith('up')) ]

# measure the main disk usage
def measure_disk ():
    dat = psutil.disk_usage('/')
    return [ Measure('disk_space_total', dat.total),
             Measure('disk_space_used', dat.used),
             Measure('disk_space_free', dat.free),
             Measure('disk_space_reserved', dat.total - dat.free - dat.used) ]


dat = []
dat += measure_cpu()
dat += measure_ram()
dat += measure_time()
dat += measure_hardware_info()
dat += measure_temp()
dat += measure_connection()
dat += measure_disk()
out = json.dumps([entry.__dict__ for entry in dat], separators=(',', ':'))
print(out)
