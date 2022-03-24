#!/usr/bin/env coffee

import {createReadStream,existsSync,createWriteStream} from 'fs'
import {UnpackrStream,PackrStream} from 'msgpackr'

class Kv extends Map
  constructor:(@path)->
    super()

  save:->
    receivingStream = new UnpackrStream()
    stream = new PackrStream()
    promise = new Promise (resolve, reject)=>
      stream.pipe(
        createWriteStream(@path).on(
          'finish'
          resolve
        ).on 'error',reject
      )
    stream.pipe(receivingStream)
    for [k,v] from @entries()
      stream.write(k)
      stream.write(v)
    stream.end()
    promise

Db = (path)=>
  kv = new Kv path

  if not existsSync path
    return kv

  pos = 0

  k = undefined

  stream = new UnpackrStream().on 'data',(data)=>
    if pos++ % 2
      kv.set(k,data)
    else
      k = data
    return

  createReadStream(
    path
  ).pipe stream

  new Promise(
    (resolve, reject)=>
      stream.on 'end',=>resolve(kv)
      stream.on 'error',reject
  )


export default main = new Proxy(
  Db
  get:(_,name)=>
    Db(name)
)

if process.argv[1] == decodeURI (new URL(import.meta.url)).pathname
  {default:thisdir} = await import('@rmw/thisdir')

  pwd = thisdir import.meta
  db = await main[pwd+'/test.db']
  console.log db
  console.log db.get('path')
  await db.save()
  process.exit()
