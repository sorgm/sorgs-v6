#!/bin/bash
set -e

# Disable strict host key checking (STRATO rotates host keys)
mkdir -p ~/.ssh
echo "Host $SFTP_HOST
  StrictHostKeyChecking no
  UserKnownHostsFile=/dev/null" >> ~/.ssh/config

# Run SFTP in batch mode
sftp \
  -o "BatchMode=no" \
  -o "StrictHostKeyChecking=no" \
  -P "$SFTP_PORT" \
  -p \
  -v \
  -b deploy.sftp \
  "$SFTP_USER@$SFTP_HOST"
