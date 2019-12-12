#!/usr/bin/env python3

import json
import psutil

# object that represents one measurement that has been done
class Measure:

    def __init__(self, title, value):
        self.title = title
        self.value = value

# function that calculates the average of a list of numbers
# input can be either 1 list object or multiple numbers
def avg(*l):
    if isinstance(l[0], list):
        l = l[0]
    return sum(l) / len(l)

# returns the cpu usage times from last boot as a list of properties
def measure_cpu():
    dat = [entry.system + entry.user for entry in psutil.cpu_times(True)]
    return [ Measure('cpu_times_total', avg(dat)),
             Measure('cpu_times_cores', dat) ]

dat = measure_cpu()
out = json.dumps([entry.__dict__ for entry in dat], separators=(',', ':'))
print(out)
