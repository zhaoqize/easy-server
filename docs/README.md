### 启动本地文件服务

| 库 | 作用 |
| --- | --- |
| [connect]() | http服务的nodejs的中间件 |
| [send]() | 从文件系统传输文件的库 |
| [opn]() | 终端打开浏览器 |

#### 基本参数

- host
- 端口号
- 指定的目录地址

```js
  let host = options.host || '0.0.0.0'; // host
  let port = options.port ? options.port : 8080; // 端口号 (默认:8080)
  let root = dir || process.cwd(); // 要启动的目录（默认:当前目录）
```

判断是否为文件:
```js
  fs.statSync(root) // 返回指定的文件相关信息
  fs.statSync(root).isFile() // 返回指定的文件是否为文件的布尔值
```


#### 监听事件

- 成功：listening
- 失败：error

```js
  server.addListener('listening', (e) => {
    ....
  })

  server.addListener('error', (e) => {
    ....
  })
```

获取 http 服务的网络信息:
```js
 server.address(); // return { address: '0.0.0.0', family: 'IPv4', port: 59522 }
 server.address().address // 获取IP
```

### 启动监听

| 库 | 作用 |
| --- | --- |
| [chokidar]() | fs.watch的封装 |
| [serveIndex]() | 提供包含给定路径的目录列表的页面 |

> 主要是 chokidar 库的使用，在服务断掉的时候关闭监听

#### 基本参数

```js
  let watchPatch = options.watch || [root]; // 监听的目录 (默认:当前目录)
  let ignorePath = options.ignore || ['node_modules', '.git', '.gitignore', 'package.json']; // 忽略的目录（默认:'node_modules', '.git', '.gitignore', 'package.json'
  let entryFile = options.file; // 指定打开的目录
```

- 给出具体的监听路径（比如 ./ 对应的是当前目录）
- 忽略某些文件的监听（比如node_modules）
- 在不指定的file的情况下默认列出所有的文件

### 热刷新

在浏览器和服务器之间创建WebSocket链接，服务器端在执行完动态编译之后发送reload事件至浏览器，浏览器接收到事件并刷新页面

参考库：[livereload-js]()
