#!/usr/bin/env coffee

export default main = =>
  return 1

if process.argv[1] == decodeURI (new URL(import.meta.url)).pathname
  console.log await main()
  process.exit()

