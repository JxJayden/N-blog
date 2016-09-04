var mongodb = require('./db');
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
  mongodb.open(function (err, db) {
    if (err) {
        logger.debug("open 步骤出错 "+err);
      return callback(err);
    }
    //读取 posts 集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        logger.debug("collection 步骤出错 "+err);
        return callback(err);
      }
      //将文档插入 posts 集合
      collection.insert(post, {
        safe: true
      }, function (err) {
        mongodb.close();
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
  mongodb.open(function (err, db) {
    if (err) {
        logger.debug("open 步骤出错 "+err);
      return callback(err);
    }
    //读取 posts 集合
    db.collection('posts', function(err, collection) {
      if (err) {
        mongodb.close();
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
        mongodb.close();
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

// getOne
Post.getOne = function(name,day,title,callback){
  mongodb.open(function(err,db){
    if (err) {
        logger.debug("open 步骤出错 "+err);
      return callback(err);
    }
    db.collection('posts',function (err,collection) {
      // 处理错误
      if (err) {
        mongodb.close();
        logger.debug("collection 步骤出错 "+err);
        callback(err);
      }
      collection.findOne({
        "name": name,
        "time.day": day,
        "title": title
      },function(err,doc){
        mongodb.close();
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
  mongodb.open(function(err,db){
    if (err) {
        logger.debug("open 步骤出错 "+err);
      return callback(err);
    }
    db.collection('posts',function(err,collection){
      if (err) {
        logger.debug("collection 步骤出错 "+err);
        mongodb.close();
        return callback(err);
      }
      collection.findOne({
        "name": name,
        "time.day":day,
        "title":title
      },function (err,doc) {
          mongodb.close();
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
  mongodb.open(function(err,db){
    if (err) {
      return callback(err);
    }
    db.collection('posts',function (err,collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      collection.update({
        "name": name,
        "time.day": day,
        "title": title
      },{
        $set: {post: post}
      },function (err) {
        mongodb.close();
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
  mongodb.open(function (err,db) {
    if (err) {
        logger.debug("open 步骤出错 "+err);
      return callback(err);
    }
    db.collection('posts',function(err,collection){
      if (err) {
        logger.debug("collection 步骤出错 "+err);
        mongodb.close();
      }
      collection.remove({
        "name": name,
        "time.day":day,
        "title":title
      },{
        w:1
      },function(err){
        mongodb.close();
        if (err) {
        logger.debug("remove 步骤出错 "+err);
        return callback(err);
        }
        callback(null);
      });
    });
  });
};