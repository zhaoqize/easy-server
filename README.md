[![npm](https://img.shields.io/npm/v/easy-servers.svg?style=flat)](https://github.com/zhaoqize/easy-server)
[![GitHub license](https://img.shields.io/github/license/zhaoqize/easy-server.svg)](https://github.com/zhaoqize/easy-rollback/blob/master/LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)]()
# easy-server
easy-server

### 安装
```js
npm install -g easy-servers
```

### 执行 
`easy server -h`
```js
  Usage: server [options] <dir>

  A Fast Local Server

  Options:

    -p, --port <number>  select port to use, default: PORT env var or 8080
    -i, --ignore <path>  paths to ignore, default: node_modules
    -f, --file <path>    file entry , default: all
    -h, --help           output usage information
```

### 使用
```js
easy server <dir> -p 8081 -i .gitignore -f index.html
```

### 效果
```shell
Serving ./ at:
http://127.0.0.1:8080
http://192.168.31.171:8080
Ready for changes
Directory docs/README.md has been added
Directory bin/index.js has been added
Directory lib/main.js has been added
Directory lib/main.js has been changeed
```

## License

MIT © [zhaoqize]()
