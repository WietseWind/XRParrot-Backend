#!/bin/bash

ssh -t xrparrot 'docker exec -it xrparrot-api sh -c "cd /usr/src/app;/usr/local/bin/pm2 monit"'
