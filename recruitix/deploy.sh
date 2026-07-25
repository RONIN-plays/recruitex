#!/bin/bash
echo "Emergency deployment script"
npm install --production --no-optional --no-audit --no-fund
npm run build