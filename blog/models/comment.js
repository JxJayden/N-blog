var MongoClient = require('mongodb').MongoClient,
    settings = require('../settings'),
    logger = require('log4js').getLogger("models");


function Comment(name,day,title,comment) {
 this.name = name;
 this.day = day;
 this.title = title;
 this.comment = comment;
}

module.exports = Comment;

// 存储一条留言信息
Comment.prototype.save = function (callback) {
 var name = this.name,
  day = this.day,
  title = this.title,
  comment = this.comment;

  MongoClient.connect(settings.url,function(err,db){
   if (err) {
    return callback(err);
   }
   logger.debug('Connection established to', settings.url);
   db.collection('posts',function(err,collection){
    if (err) {
     db.close();
     return callback(err);
    }
    collection.update({
     "name":name,
     "time.day":day,
     "title":title
    },{
     $push: {"comments":comment}
    },function(err){
     db.close();
     if (err) {
      return callback(err);
     }
     callback(null);
    });
   });
  });
};