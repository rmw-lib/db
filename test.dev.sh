#!/usr/bin/env bash
set -e
DIR=$( dirname $(realpath "$0") )

cd $DIR

./dev.sh test/index.coffee
