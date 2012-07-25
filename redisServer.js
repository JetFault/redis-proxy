var redis = require('redis');
var events = require('events');

var logTrace = require('./tracelog.js');
var log;

function redisServer(host, port, logger) {
	this.host = host;
	this.port = port;
	this.client = null;
	this.errors = 0;
	this.up = false;
	events.EventEmitter.call(this);

	if(logger == null) log = logTrace.makeLogger();
	else log = logger;

	this.start();
}

//Inherit event emitter
redisServer.super_ = events.EventEmitter;
redisServer.prototype = Object.create(events.EventEmitter.prototype, {
    constructor: {
        value: redisServer,
        enumerable: false
    }
});

redisServer.prototype.toString = function() {
	return this.host + ":" + this.port;
};

/**
 * Check if Server is up
 * Returns: Boolean
 */
redisServer.prototype.isUp = function() {
	if(this.up) {
		return true;
	}
	return false;
};

/**
 * Start the redis server and attach event handler
 */
redisServer.prototype.start = function() {
	var self = this;
	if(!self.isUp()) {
		self.client = redis.createClient(self.port, self.host);

		if(self.client !== null) {
			self.attachHandler();
		} 
		else {
			log.error("Redis Server: " + self + " - Client Null");
		}
	}
};

/**
 * Attach event handlers for redis events
 */
redisServer.prototype.attachHandler = function() {
	var self = this;
	var client = self.client;
	client.on('ready', function(data) {
		log.info("redis Server: " + self + " - Ready");
		self.up = true;
		self.emit('ready');
	});
	client.on('error', function(err) {
		self.errors++;
		if(self.errors < 4) {
			log.error("Redis Server:" + self + " - " + err);
		} 
		else if(self.errors > 300) {
			self.errors = 0;
		}
	});
	client.on('end', function(data) {
		log.info("redis Server: " + self + " - Ended");
		self.up = false;
		self.emit('end');
	});
};

module.exports = redisServer;
