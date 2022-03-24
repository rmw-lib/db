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

export default Db = (path)=>
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
