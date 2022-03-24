<!-- 本文件由 ./readme.make.md 自动生成，请不要直接修改此文件 -->

# @rmw/db


##  安装

```yarn add @rmw/db ``` 或者 ``` npm install @rmw/db```

## 使用

```
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
```

## 关于

本项目隶属于**人民网络([rmw.link](//rmw.link))** 代码计划。

![人民网络](https://raw.githubusercontent.com/rmw-link/logo/master/rmw.red.bg.svg)