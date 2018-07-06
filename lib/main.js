const connect = require('connect');
const http = require('http');
const send = require('send');
const url = require('url');
const os = require('os');
const open = require('opn');
const fs = require('fs');
const chalk = require('chalk');

// 静态文件处理
function staticServer (root) {
  // 判断是否为文件
  let isFile = false;
	try {
		isFile = fs.statSync(root).isFile();
	} catch (e) {
    if (e.code !== "ENOENT") {
      throw e;
    }
  }
  
  return function(req, res, next) {
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
  }
}

async function server (dir, options) {
  // 确定 host、port、要启动的目录（没有就默认为当前目录）
  let host = options.host || '0.0.0.0';
	let port = options.port ? options.port : 8080; 
  let root = dir || process.cwd();

  let staticServerHandler = staticServer(root);
  // 启动 server
  let app = connect();
  app.use(staticServerHandler) // Custom static server
  
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
			server.close();
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
}

module.exports = (dir, options) => {
  server(dir, options).catch(err => {
    console.log(chalk.red(err))
    process.exit(1)
  })
}