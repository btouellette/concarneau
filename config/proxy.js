var proxy = {
	host: '',
	port: 0
}, __debug;

var http = require('http'),
	__http_request = http.request;
http.request = function (options, callback) {
	// Not currently adding any proxy information to http requests
	// If needed later here is a working http request through a proxy
	// http.get({
	//     host: proxy.host,
	//     port: proxy.port,
	//     path: 'http://httpbin.org/html',
	//     headers: {
	//         Host: 'httpbin.org'
	//     }
	// }, function (res) {
	//     console.log(res);
	// });
	if(__debug) {
		console.log('http passthrough: ' + JSON.stringify(options));
	}
	var __options = options;
	return __http_request(__options, callback);
}

var https = require('https'),
	tunnel = require('tunnel'),
	__https_request = https.request;
https.request = function (options, callback) {
	if(__debug) {
		console.log('https passthrough: ' + JSON.stringify(options));
	}
	var __options = options;
	__options.agent = tunnel.httpsOverHttp({
		proxy: {
			host: proxy.host,
			port: proxy.port
		}
	});
	return __https_request(__options, callback);
}

module.exports = function (host, port, debug) {
	proxy.host = host;
	proxy.port = port;
	__debug = debug;
};