#!/bin/bash

# Start the first process
node index.js &

# Start the second process
# tor -f /etc/torrc &

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?