#!/bin/bash
# Script to copy local database to Fly.io machine

# Convert database to hex and copy via SSH
xxd -p ./data/ezbookkeeping.db | tr -d '\n' | flyctl ssh console -C "xxd -r -p > /tmp/new_ezbookkeeping.db && mv /tmp/new_ezbookkeeping.db /ezbookkeeping/data/ezbookkeeping.db && chown ezbookkeeping:ezbookkeeping /ezbookkeeping/data/ezbookkeeping.db"