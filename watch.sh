#!/bin/bash

ssh xrparrot "docker logs --tail 30 -f xrparrot-api"
