<?php

# This file is only here to excute the python code in 'get.py'
# This is aimed to be the only php code in the project, for ease of use this
#   code is kept in as a bridge between python and the web server

# prints the output of the 'get.py' script
$output;
exec('python3 get.py', $output);
print($output[0]);