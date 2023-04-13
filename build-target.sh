#!/bin/bash

version=$(jq -r '.version' package.json)
echo "Building version $version"

pnpm build
zip -r "chrome_$version.zip" extension
pnpm build-edge
zip -r "edge_$version.zip" extension

