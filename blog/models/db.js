var settings = require('../settings'),
    Db = require('mongodb').Db,
    Connection = require('mongodb').Connection,
    logger = require('log4js').getLogger("models"),
    Server = require('mongodb').Server;

module.exports = new Db(settings.db,new Server(settings.host,settings.port),{safe:true});