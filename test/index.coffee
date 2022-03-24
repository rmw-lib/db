#!/usr/bin/env coffee

import "@rmw/console/global"
import Db from '@rmw/db'
import thisdir from '@rmw/thisdir'
import {join} from 'path'

PWD = thisdir import.meta
db = await Db join PWD,'test.db'

console.log db

db.set 1,[2,3,4,5]

await db.save()

process.exit()
