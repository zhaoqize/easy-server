const connect = require('connect');
const http = require('http');
const send = require('send');
const url = require('url');
const os = require('os');
const open = require('opn');
const fs = require('fs');
const chalk = require('chalk');

function staticServer (root) {
  var isFile = false;
	try {
		isFile = fs.statSync(root).isFile();
	} catch (e) {
		if (e.code !== "ENOENT") throw e;
  }
  
  return function(req, res, next) {
    if (req.method !== "GET" && req.method !== "HEAD") {
      return next();
    }
    let reqpath = isFile ? "" : url.parse(req.url).pathname;
    
    function directory() {
			var pathname = url.parse(req.originalUrl).pathname;
			res.statusCode = 301;
			res.setHeader('Location', pathname + '/');
			res.end('Redirecting to ' + escape(pathname) + '/');
		}

    function error(err) {
			if (err.status === 404) return next();
			next(err);
    }

    send(req, reqpath, { root: root })
			.on('error', error)
			.on('directory', directory)
			.pipe(res);
  }
}

async function server (dir, options) {
  const host = options.host || '0.0.0.0';
	const port = options.port !== undefined ? options.port : 8080;
  const root = dir || process.cwd(); // 要启动的目录，没有就默认为当前目录

  let staticServerHandler = staticServer(root);
  // 启动 server
  const app = connect();
  app.use(staticServerHandler) // Custom static server
 
  let server = http.createServer(app);
  let protocol = "http";

  // Handle server startup errors
	server.addListener('error', (e) => {
		if (e.code === 'EADDRINUSE') {
			var serveURL = protocol + '://' + host + ':' + port;
			console.log(chalk.red(`${serveURL} is already in use. Trying another port.`));
			setTimeout(() => {
				server.listen(0, host);
			}, 1000);
		} else {
			console.log(chalk.red(e.toString()));
			server.close();
		}
  });

  // Handle successful server
  server.addListener('listening', (/*e*/) => {

		var address = server.address();
		var serveHost = address.address === "0.0.0.0" ? "127.0.0.1" : address.address;
		var openHost = host === "0.0.0.0" ? "127.0.0.1" : host;

		var serveURL = protocol + '://' + serveHost + ':' + address.port;
		var openURL = protocol + '://' + openHost + ':' + address.port;

		var serveURLs = [ serveURL ];
		if (address.address === "0.0.0.0") {
			var ifaces = os.networkInterfaces();
			serveURLs = Object.keys(ifaces)
				.map((iface) => {
					return ifaces[iface];
				})
				// flatten address data, use only IPv4
				.reduce(function(data, addresses) {
					addresses.filter(function(addr) {
						return addr.family === "IPv4";
					}).forEach(function(addr) {
						data.push(addr);
					});
					return data;
				}, [])
				.map(function(addr) {
					return protocol + "://" + addr.address + ":" + address.port;
				});
		}

		// Output
    if (serveURL === openURL) {
      if (serveURLs.length === 1) {
        console.log(chalk.green(`Serving ${root} at ${serveURLs[0]}`));
      } else {
        console.log("Serving \"%s\" at\n\t%s", root, serveURLs.join("\n\t"));
      }
    } else {
      console.log(chalk.green(`Serving ${root} at ${openURL} (${serveURL})`));
    }

		open(openURL);
	});
  
  server.listen(port, host);
}

module.exports = (dir, options) => {
  server(dir, options).catch(err => {
    console.log(chalk.red(err))
    process.exit(1)
  })
}