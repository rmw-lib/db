#!/usr/bin/env bash

. $HOME/.asdf/asdf.sh

DIR=$(cd "$(dirname "$0")"; pwd)
set -ex
cd $DIR/lib

node="node --trace-warnings --es-module-specifier-resolution=node --trace-uncaught --expose-gc --unhandled-rejections=strict"

NODE_ENV=production exec $node index.js
