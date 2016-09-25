var settings = require('../settings');
var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var logger = require('log4js').getLogger("models");
var Server = require('mongodb').Server;

module.exports = new Db(settings.db,new Server(settings.host,settings.port),{safe:true});
