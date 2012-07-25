var should  = require('should');
var redisProxy = require('../repController');

var sys = require('util');
var exec = require('child_process').exec;

describe('proxy', function() {
	beforeEach(function() {
		this.timeout(5000);
	});

	before(function(done) {
		exec(__dirname + '/launch.sh start', function(error, stdout, stderr) {
			console.log(stdout);
			setTimeout(function() {
				done();
			}, 2000);
		});
	});

	it('should be constructed null', function() {
		var proxy = new redisProxy(__dirname + "/../logs/rProxyTest.log");
		proxy.should.have.property('master', null);
		proxy.should.have.property('slave', null);
	});

	it('should add master if non-exists', function(done) {
		var proxy = new redisProxy(__dirname + "/../logs/rProxyTest.log");
		proxy.addMaster('127.0.0.1', '5555');
		
		setTimeout(function() {
			proxy.master.should.have.property('up', true);
			done();
		},
		2000);
	});

	it('should add slave with no master', function(done) {
		var proxy = new redisProxy(__dirname + "/../logs/rProxyTest.log");
		proxy.addSlave('127.0.0.1', '5556');
		setTimeout(function() {
			proxy.slave.should.have.property('up', true);
			done();
		},
		2000);
	});

	it('should add master and slave', function(done) {
		var proxy = new redisProxy(__dirname + "/../logs/rProxyTest.log");
		proxy.addMaster('127.0.0.1', '5555');
		proxy.addSlave('127.0.0.1', '5556');
		setTimeout(function() {
			proxy.master.should.have.property('up', true);
			proxy.slave.should.have.property('up', true);
			done();
		},
		2000);
	});


	it('should addID with master and slave up', function(done) {
		var proxy = new redisProxy(__dirname + "/../logs/rProxyTest.log");
		proxy.addMaster('127.0.0.1', '5555');
		proxy.addSlave('127.0.0.1', '5556');
		setTimeout(function() {

			var redisClient = proxy.getClientWrite();
			redisClient.flushall();
			should.exist(redisClient);
			redisClient.sadd('dev', '1', function(err, reply) {
				reply.should.equal(1);
			});

			redisClient.sadd('dev', '2', function(err, reply) {
				reply.should.equal(1);
			});

			redisClient.sadd('dev', '2', function(err, reply) {
				reply.should.equal(0);
			});

			done();
		},
		2000);
	});


	it('should switch to slave if master goes down', function(done) {
		var proxy = new redisProxy(__dirname + "/../logs/rProxyTest.log");
		proxy.addMaster('127.0.0.1', '5555');
		proxy.addSlave('127.0.0.1', '5556');
		setTimeout(function() {
			
			var master = proxy.master;

			exec(__dirname + '/launch.sh stop Master', function() {
				var redisClient = proxy.getClientWrite();
				should.exist(redisClient);

				redisClient.flushall();
				redisClient.sadd('dev', '1', function(err, reply) {
					redisClient.should.not.equal(master);
					reply.should.equal(1);
					done();
				});
			});

		},
		2000);
	});

	it('should return null if slave and master are down', function(done) {
		var proxy = new redisProxy(__dirname + "/../logs/rProxyTest.log");
		proxy.addMaster('127.0.0.1', '5555');
		proxy.addSlave('127.0.0.1', '5556');
		setTimeout(function() {

			var master = proxy.master;

			exec(__dirname + '/launch.sh stop Master', function() {
				exec(__dirname + '/launch.sh stop Slave', function(error,stdout,stderr) {
					console.log(stdout);
					var redisClient = proxy.getClientWrite();
					should.not.exist(redisClient);
					done();
				});
			});

		},
		2000);
	});
});
