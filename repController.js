var redisServer = require('./redisServer.js');

var logTrace = require('./tracelog.js');
var logger;

function redisRepClient(logfile) {
  this.master = null;
  this.slave = null;
  if(logfile == null) logger = logTrace.makeLogger();
  else logger = logTrace.makeLogger(this.logfile);
}

redisRepClient.prototype.addMaster = function(host, port) {
  this.master = new redisServer(host, port, logger);
  logger.info("New Master added: " + this.master);
};

redisRepClient.prototype.addSlave = function(host, port) {
  this.slave = new redisServer(host, port, logger);
  logger.info("New Slave added: " + this.slave);

  //If Master is up, make this slave of master
  //If not, then we will do it when master becomes ready
  if(this.master !== null && this.master.isUp()) {
    this.slave.client.slaveof(this.master.client.host, this.master.client.port, function(err) {
      if(err) {
        logger.error("Can't make " + this.slave + "a slave of " + self.master +
          "\n\t" + err);
      }
      else {  
        logger.info(this.slave + " is now a slave of " + self.master);
      }
    });
  }
  else {
    logger.info("Master isn't up yet. Can't make: " + this.slave + " into slave");
  }
};

var attachHandler = function() {
  var self = this;

  var readyHandler = function() {
    //If I am not the master and master is up
    //Then make me the slave of master
    if(this !== self.master && self.master.isUp()) {
      this.client.slaveof(self.master.client.host, self.master.client.port, function(err) {
        if(err) {
          //DB will not be synced if this occurs
          logger.error("Can't make " + this + "a slave of " + self.master +
            "\n\t" + err);
        }
        else {  
          logger.info(this + " is now a slave of " + self.master);
        }
      });
    }
    //If I am the master and slave is up
    //Then make the slave the slave of me
    else if(this === self.master && self.slave.isUp()) {
      this.slave.client.slaveof(this.master.client.host, this.master.client.port, function(err) {
        if(err) {
          logger.error("Can't make " + this.slave + "a slave of " + self.master +
            "\n\t" + err);
        }
        else {  
          logger.info(this.slave + " is now a slave of " + self.master);
        }
      });
    }
  };

  var endHandler = function() {
    //If master went down,
    //Then make the slave be the new master
    if(self.slave.isUp() && this === self.master) {
      logger.warn(this + " (Master) went down, making " + self.slave + 
          " (Slave) the new master");

      var tmp = self.master;
      self.master = self.slave;
      self.slave = tmp;

      self.master.client.slaveof('no', 'one', function(err) {
        if(err) {
          logger.error("Can't make " + this + " master: " + err);
        }
        else {  
          logger.info(this + " is now a master");
        }
      });
    }
  };
  

  self.master.on('ready', readyHandler);
  self.slave.on('ready', readyHandler);
  self.master.on('end', endHandler);
  self.slave.on('end', endHandler);
};

redisRepClient.prototype.getClientWrite = function() {
  if(this.master && this.master.isUp()) {
    logger.debug("Return client to write from: " + this.master);
    return this.master.client;
  }
  else if(this.slave && this.slave.isUp()) {
    logger.debug("Return client to write from: " + this.slave);
    return this.slave.client;
  }
  else {
    logger.error("Master and Slave are not up");
    return null;
  }
};

redisRepClient.prototype.getClientRead = function() {
  if(this.slave && this.slave.isUp()) {
    logger.debug("Return client to read from: " + this.slave);
    return this.slave.client;
  }
  else if(this.master && this.master.isUp()) {
    logger.debug("Return client to read from: " + this.master);
    return this.master.client;
  }
  else {
    logger.error("Master and Slave are not up");
    return null;
  }
};

module.exports = redisRepClient;
