var stdin = process.openStdin();
var http = require('http');

var repCont = require('../repController');
var proxy = new repCont();
proxy.addMaster('127.0.0.1', '5555');
proxy.addSlave('127.0.0.1', '5556');

//Writing
function addID(key, value) {
	var redisClient = proxy.getClientWrite();

	if(redisClient !== null) {
		redisClient.sadd(key, value, function(err, reply) {
			if (reply == "1") {
				console.log("success: " + reply);
			}
			else {
				console.log("failure: " + err);
			}
		});
	}
	else {
		console.log("null redis client");
	}
}



//Getting input
http.createServer(function(request, response) {
	var chunk = request.url.substring(1);
	if(chunk.length > 0)
		addID("http", chunk);
	response.end();
}).listen(6000);

stdin.on('data', function(chunk) {
	addID("stdin", chunk);
});

