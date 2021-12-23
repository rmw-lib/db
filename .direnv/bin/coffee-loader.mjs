// coffeescript-loader.mjs
import { readFile } from "fs/promises";
import { readFileSync } from "fs";
import { createRequire } from "module";
import { dirname, extname, resolve as resolvePath } from "path";
import { cwd } from "process";
import "@rmw/source-map-support/register";
import { fileURLToPath, pathToFileURL } from "url";

import CoffeeScript from "coffeescript";

const baseURL = pathToFileURL(`${cwd}/`).href;

// CoffeeScript 文件以 .coffee、.litcoffee 或 .coffee.md 结尾。
const extensionsRegex = /\.coffee$/;

const IGNORE = new Set("coffee yaml txt js mjs wasm json node".split(" "));

export async function resolve(specifier, context, defaultResolve) {
  const { parentURL = baseURL } = context;

  var ext = specifier.slice(specifier.lastIndexOf(".") + 1);
  if (
    !IGNORE.has(ext) &&
    !specifier.endsWith(".") &&
    specifier.startsWith(".")
  ) {
    specifier = specifier + parentURL.slice(parentURL.lastIndexOf("."));
  }

  // Node.js 通常在未知文件扩展名上出错，
  // 因此返回以 CoffeeScript 文件扩展名结尾的说明符的 URL。
  if (extensionsRegex.test(specifier)) {
    return {
      url: new URL(specifier, parentURL).href,
    };
  }

  // 让 Node.js 处理所有其他说明符。
  return defaultResolve(specifier, context, defaultResolve);
}

export async function load(url, context, defaultLoad) {
  // 现在修补了解决以让 CoffeeScript URL 通过，
  // 需要告诉 Node.js 这样的 URL 应该被解释为什么格式。
  // 为了这个加载器的目的，所有 CoffeeScript URL 都是 ES 模块。
  // 因为 CoffeeScript 会转译成 JavaScript，
  // 所以它应该是两种 JavaScript 格式之一：'commonjs' 或 'module'。
  if (extensionsRegex.test(url)) {
    // CoffeeScript 文件可以是 CommonJS 或 ES 模块，
    // 因此我们希望 Node.js 将任何 CoffeeScript 文件视为相同位置的 .js 文件。
    // 要确定 Node.js 如何解释任意 .js 文件，
    // 则在文件系统中搜索最近的父 package.json 文件
    // 并读取其 "type" 字段。
    const format = await getPackageType(url);
    // 当钩子返回 'commonjs' 格式时，则 `source` 将被忽略。
    // 为了处理 CommonJS 文件，需要使用 `require.extensions` 注册句柄，
    // 以便使用 CommonJS 加载器处理文件。
    // 避免需要单独的 CommonJS 处理程序
    // 是 ES 模块加载器计划的未来增强功能。
    if (format === "commonjs") {
      return { format };
    }

    const { source: rawSource } = await defaultLoad(url, { format });
    // 此钩子将所有导入的 CoffeeScript 文件的 CoffeeScript 源代码
    // 转换为的 JavaScript 源代码。
    const transformedSource = CoffeeScript.compile(rawSource.toString(), {
      bare: true,
      filename: url,
      inlineMap: true,
    });

    return {
      format,
      source: transformedSource,
    };
  }

  // 让 Node.js 处理所有其他 URL。
  return defaultLoad(url, context, defaultLoad);
}

async function getPackageType(url) {
  // `url` is only a file path during the first iteration when passed the
  // resolved url from the load() hook
  // an actual file path from load() will contain a file extension as it's
  // required by the spec
  // this simple truthy check for whether `url` contains a file extension will
  // work for most projects but does not cover some edge-cases (such as
  // extension-less files or a url ending in a trailing space)
  const isFilePath = !!extname(url);
  // 如果是文件路径，则获取它所在的目录
  const dir = isFilePath ? dirname(fileURLToPath(url)) : url;
  // 生成同一个目录下的 package.json 的文件路径，
  // 文件可能存在也可能不存在
  const packagePath = resolvePath(dir, "package.json");
  // 尝试读取可能不存在的 package.json
  const type = await readFile(packagePath, { encoding: "utf8" })
    .then((filestring) => JSON.parse(filestring).type)
    .catch((err) => {
      if (err?.code !== "ENOENT") console.error(err);
    });
  // 如果 package.json 存在并包含带有值的 `type` 字段
  if (type) return type;
  // 否则，（如果不在根目录下）继续检查下一个目录
  // 如果在根目录，则停止并返回 false
  return dir.length > 1 && getPackageType(resolvePath(dir, ".."));
}
