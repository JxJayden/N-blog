var MongoClient = require('mongodb').MongoClient;
var settings = require('../settings');
var logger = require('log4js').getLogger("post");
var markdown = require('markdown').markdown;

function Post(name,title,post) {
 this.name = name;
 this.title = title;
 this.post = post;
}

module.exports = Post;

// save
Post.prototype.save = function(callback) {
  var date = new Date();
  //存储各种时间格式，方便以后扩展
  var time = {
      date: date,
      year : date.getFullYear(),
      month : date.getFullYear() + "-" + (date.getMonth() + 1),
      day : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
      minute : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
      date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
  }
  //要存入数据库的文档
  var post = {
      name: this.name,
      time: time,
      title: this.title,
      post: this.post,
      comments:[]
  };
  //打开数据库
  MongoClient.connect(settings.url,function (err, db) {
    if (err) {
      logger.debug("open 步骤出错 "+err);
      return callback(err);
    }
    logger.debug('Connection established to', settings.url);

    //读取 posts 集合
    db.collection('posts', function (err, collection) {
      if (err) {
        db.close();
        logger.debug("collection 步骤出错 "+err);
        return callback(err);
      }
      //将文档插入 posts 集合
      collection.insert(post, {
        safe: true
      }, function (err) {
        db.close();
        if (err) {
        logger.debug("insert 步骤出错 "+err);
          return callback(err);//失败！返回 err
        }
        callback(null);//返回 err 为 null
      });
    });
  });
};

// getAll
Post.getAll = function(name, callback) {
  //打开数据库
  MongoClient.connect(settings.url,function (err, db) {
      if (err) {
      logger.debug("open 步骤出错 "+err);
      return callback(err);
    }
    logger.debug('Connection established to', settings.url);

    //读取 posts 集合
    db.collection('posts', function(err, collection) {
      if (err) {
        db.close();
        logger.debug("collection 步骤出错 "+err);
        return callback(err);
      }
      var query = {};
      if (name) {
        query.name = name;
      }
      //根据 query 对象查询文章
      collection.find(query).sort({
        time: -1
      }).toArray(function (err, docs) {
        db.close();
        if (err) {
          logger.debug("find 步骤出错 "+err);
          return callback(err);//失败！返回 err
        }
        logger.info(docs);
        //解析 markdown 为 html
        docs.forEach(function (doc) {
        doc.post = markdown.toHTML(doc.post);
        });
        callback(null, docs);//成功！以数组形式返回查询的结果
      });
    });
  });
};

// getTen
Post.getTen = function(name,page,callback) {
  MongoClient.connect(settings.url,function(err,db){
    if (err) {
      logger.debug("open 步骤出错 "+err);
      return callback(err);
    }
    db.collection('posts',function(err,collection){
      if (err) {
        db.close();
        return callback(err);
      }
      var query = {};
      if (name) {
        query.name = name;
      }
      collection.count(query,function (err,total) {
        // 根据 query 对象查询，并跳过前 (page-1)*10 个结果，返回之后的 10 个结果
        collection.find(query,{
          skip: (page-1)*10,
          limit: 10
        }).sort({
          time: -1
        }).toArray(function (err,docs) {
          db.close();
          if (err) {
            return callback(err);
          }
          docs.forEach(function(doc){
            doc.post = markdown.toHTML(doc.post);
          });
          callback(null,docs,total);
        });
      });
    });
  });
}

// getOne
Post.getOne = function(name,day,title,callback){
  MongoClient.connect(settings.url,function (err, db) {
    if (err) {
        logger.debug("open 步骤出错 "+err);
      return callback(err);
    }
    logger.debug('Connection established to', settings.url);
    db.collection('posts',function (err,collection) {
      // 处理错误
      if (err) {
        db.close();
        logger.debug("collection 步骤出错 "+err);
        callback(err);
      }
      collection.findOne({
        "name": name,
        "time.day": day,
        "title": title
      },function(err,doc){
        db.close();
        if (err) {
        logger.debug("findOne 步骤出错 "+err);
          return callback(err);
        }
        logger.info(JSON.stringify(doc));
        if (doc) {
        doc.post = markdown.toHTML(doc.post);
        doc.comments.forEach(function(comment){
          comment.content = markdown.toHTML(comment.content);
        })
        }
        callback(null,doc);
      });
    });
  });
}

// edit
Post.edit = function (name,day,title,callback) {
  logger.info('edit post in mongodb start');
  MongoClient.connect(settings.url,function (err, db) {
    if (err) {
      logger.debug("open 步骤出错 "+err);
      return callback(err);
    }
    logger.debug('Connection established to', settings.url);
    db.collection('posts',function(err,collection){
      if (err) {
        logger.debug("collection 步骤出错 "+err);
        db.close();
        return callback(err);
      }
      collection.findOne({
        "name": name,
        "time.day":day,
        "title":title
      },function (err,doc) {
          db.close();
        if (err) {
        logger.debug("findOne 步骤出错 "+err);
          return callback(err);
        }
        logger.info("doc is"+JSON.stringify(doc));
        callback(null,doc);
      });
    });
  });
};

// update
Post.update = function (name,day,title,post,callback) {
  logger.info('update post in mongodb start');
  MongoClient.connect(settings.url,function (err, db) {
    if (err) {
      return callback(err);
    }
    logger.debug('Connection established to', settings.url);
    db.collection('posts',function (err,collection) {
      if (err) {
        db.close();
        return callback(err);
      }
      collection.update({
        "name": name,
        "time.day": day,
        "title": title
      },{
        $set: {post: post}
      },function (err) {
        db.close();
        if (err) {
          return callback(err);
        }
        callback(null);
      });
    });
  });
};

// remove
Post.remove = function (name,day,title,callback) {
  logger.info('remove post start');
  MongoClient.connect(settings.url,function (err, db) {
    if (err) {
      logger.debug("open 步骤出错 "+err);
      return callback(err);
    }
    logger.debug('Connection established to', settings.url);
    db.collection('posts',function(err,collection){
      if (err) {
        logger.debug("collection 步骤出错 "+err);
        db.close();
      }
      collection.remove({
        "name": name,
        "time.day":day,
        "title":title
      },{
        w:1
      },function(err){
        db.close();
        if (err) {
        logger.debug("remove 步骤出错 "+err);
        return callback(err);
        }
        callback(null);
      });
    });
  });
};

// getArchive
Post.getArchive = function (callback) {
  MongoClient.connect(settings.url,function (err,db) {
    if (err) {
      return callback(err);
    }
    db.collection('posts',function(err,collection){
      if (err) {
        db.close();
        return callback(err);
      }
      // 返回只有 name、time、title 属性组成的文档数组
      collection.find({},{
        "name": 1,
        "time": 1,
        "title": 1
      }).sort({time:-1}).toArray(function(err,docs){
        db.close();
        if (err) {
          return callback(err);
        }
        callback(null,docs);
      });
    });
  });
};