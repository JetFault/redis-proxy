var fs = require('fs');
var tracer = require('tracer');
var path = require('path');

exports.makeLogger = function(logfile) {
  if(!logfile) {
    return tracer.colorConsole({level:'debug'});
  }

  return tracer.console({
    level : 'info',
    format : [
      "{{timestamp}} [{{title}}] [{{file}}:{{line}}:{{method}}] {{message}}",
      {error : "{{timestamp}} [{{title}}] [{{file}}:{{line}}:{{method}}] {{message}}"}
    ],
    dateformat : "yyyy-mm-dd HH:MM:ss,L",
    transport : function(data){
      //TODO: Make this not look idiotic, do try catch
      //Open File
      fs.open(logfile, 'a', '0644', function(e, id) {
        if(e) {
          //Dir doesn't exist
          if(e.code === 'ENOENT') {
            fs.mkdir(path.dirname(logfile), '0755', function(err) {
              //Can't make dir exit
              if(err) {
                throw new Error(err);
              }
              fs.open(logfile, 'a', '0644', function(error, id) {
                if(error) {
                  throw new Error(error);
                }
                fs.write(id, data.output+"\n", null, 'utf8', function() {
                  fs.close(id, function() { });
                });
              });
            });
          } else {
            //Not ENOENT
            throw new Error(e);
          }
        }
        else {
          //No Errors
          fs.write(id, data.output+"\n", null, 'utf8', function() {
            fs.close(id, function() { });
          });
        }
      });
    }
  });
};

//module.exports = logger
