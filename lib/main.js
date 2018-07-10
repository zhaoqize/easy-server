const connect = require('connect'); // nodejs的中间件
const http = require('http');
const send = require('send');
const url = require('url');
const os = require('os');
const open = require('opn'); // 通过终端打开浏览器
const fs = require('fs');
const chalk = require('chalk');
const chokidar = require('chokidar'); // fs.watch的封装
const serveIndex = require('serve-index');

async function server (dir, options) {
  let host = options.host || '0.0.0.0'; // host
	let port = options.port ? options.port : 8080; // 端口号 (默认:8080)
  let root = dir || process.cwd(); // 要启动的目录（默认:当前目录）
  let watchPatch = options.watch || [root]; // 监听的目录 (默认:当前目录)
  let ignorePath = options.ignore || ['node_modules', '.git', '.gitignore', 'package.json']; // 忽略的目录（默认:node_modules）
  let entryFile = options.file; // 指定打开的目录

  // 中间件函数句柄
  let staticHandler = (req, res, next) => {
    // 判断是否为文件
    let isFile = false;
    try {
      isFile = fs.statSync(root).isFile();
    } catch (e) {
      if (e.code !== "ENOENT") {
        throw e;
      }
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      return next();
    }

    // 请求的路径
    let reqpath = isFile ? "" : url.parse(req.url).pathname;

    // 发送请求
    send(req, reqpath, { root: root })
			.on('error', (err) => {
        if (err.status === 404) {
          return next();
        }
        next(err);
      })
			.on('directory', () => {
        let pathname = url.parse(req.originalUrl).pathname;
        res.statusCode = 301;
        res.setHeader('Location', pathname + '/');
        res.end('Redirecting to ' + escape(pathname) + '/');
      })
			.pipe(res);
  };

  // 指定了入口文件时调用
  function entryPoint(staticHandler, file) {
    if (!file) {
      return function(req, res, next) { next(); };
    }
    return function(req, res, next) {
      req.url = "/" + file; // 设置特定的访问文件
      staticHandler(req, res, next);
    };
  }

  // 启动中间件
  let app = connect();

  app.use(staticHandler)
      .use(entryPoint(staticHandler, entryFile))
      .use(serveIndex(root, { icons: true }));
  
  // 创建 server
  let server = http.createServer(app);
  let protocol = "http";

  // 启动失败处理
	server.addListener('error', (e) => {
		if (e.code === 'EADDRINUSE') {
			let serveURL = protocol + '://' + host + ':' + port;
			console.log(chalk.red(`${serveURL} is already in use. Trying another port.`));
			setTimeout(() => {
				server.listen(0, host);
			}, 1000);
		} else {
      console.log(chalk.red(e.toString()));

      // 关闭服务
      if (server) {
        server.close();
      }

      // 关闭文件监听
      if (watcher) {
        watcher.close()
      }
		}
  });

  // 启动成功处理
  server.addListener('listening', () => {
    let address = server.address(); // return { address: '0.0.0.0', family: 'IPv4', port: 59522 }
		let serveHost = address.address === "0.0.0.0" ? "127.0.0.1" : address.address;
		let openHost = host === "0.0.0.0" ? "127.0.0.1" : host;

		let serveURL = protocol + '://' + serveHost + ':' + address.port;
		let openURL = protocol + '://' + openHost + ':' + address.port;

    let serveURLs = [serveURL];

    // 如果是本地，获取IP地址
		if (address.address === "0.0.0.0") {
      // 获取网络情况
      let ifaces = os.networkInterfaces();
			serveURLs = Object.keys(ifaces).map((iface) => {
					return ifaces[iface];
				})
				.reduce((data, addresses) => {
					addresses.filter((addr) => {
						return addr.family === "IPv4"; // 只取得 IPv4
					}).forEach((addr) => {
						data.push(addr);
					});
					return data;
				}, [])
				.map((addr) => {
					return protocol + "://" + addr.address + ":" + address.port;
        });
    }
    
    // 输出
    if (serveURL === openURL) {
      if (serveURLs.length === 1) {
        console.log(chalk.green(`Serving ${root} at ${serveURLs[0]}`));
      } else {
        console.log(chalk.green(`Serving ${root} at:\n${serveURLs.join("\n")}`));
      }
    } else {
      console.log(chalk.green(`Serving ${root} at ${openURL} (${serveURL})`));
    }

    // 浏览器打开
		open(openURL);
	});
  
  // 启动监听
  server.listen(port, host);

  // 启动文件变动监控
  const watcher = chokidar.watch(watchPatch, {
    ignored: ignorePath, // 忽略的文件
  });

  watcher
    .on("change", path => console.log(`Directory ${path} has been changeed`))
    .on("add", path => console.log(`Directory ${path} has been added`))
    .on("unlink", path => console.log(`Directory ${path} has been unlinked`))
    .on("addDir", path => console.log(`Directory ${path} has been addDired`))
    .on("unlinkDir", path => console.log(`Directory ${path} has been unlinkDired`))
    .on("ready", () => {
      console.log('Ready for changes');
    })
    .on("error", (err) => {
      console.log("ERROR:".red, err);
    });
   
}

module.exports = (dir, options) => {
  server(dir, options).catch(err => {
    console.log(chalk.red(err))
    process.exit(1)
  })
}