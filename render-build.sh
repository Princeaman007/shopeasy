#!/bin/bash
npm install -g pnpm
pnpm install --no-frozen-lockfile
cd apps/api
pnpm build