var MongoClient = require('mongodb').MongoClient,
    settings = require('../settings'),
    logger = require('log4js').getLogger("post"),
    markdown = require('markdown').markdown;

function Post(name, title, tags, post) {
    this.name = name;
    this.title = title;
    this.tags = tags;
    this.post = post;
};

module.exports = Post;

// save
Post.prototype.save = function(callback) {
    var date = new Date();
    //存储各种时间格式，方便以后扩展
    var time = {
            date: date,
            year: date.getFullYear(),
            month: date.getFullYear() + "-" + (date.getMonth() + 1),
            day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
            minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
                date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
        }
        //要存入数据库的文档
    var post = {
        name: this.name,
        time: time,
        title: this.title,
        tags: this.tags,
        post: this.post,
        comments: [],
        reprint_info: {},
        pv: 0
    };
    //打开数据库
    mongodb.open(function(err, db) {
        if (err) {
            logger.debug("open 步骤出错 " + err);
            return callback(err);
        }
        //读取 posts 集合
        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                logger.debug("collection 步骤出错 " + err);
                return callback(err);
            }
            //将文档插入 posts 集合
            collection.insert(post, {
                safe: true
            }, function(err) {
                mongodb.close();
                if (err) {
                    logger.debug("insert 步骤出错 " + err);
                    return callback(err); //失败！返回 err
                }
                callback(null); //返回 err 为 null
            });
        });
    });
};

// getAll
Post.getAll = function(name, callback) {
    //打开数据库
    mongodb.open(function(err, db) {
        if (err) {
            logger.debug("open 步骤出错 " + err);
            return callback(err);
        }
        //读取 posts 集合
        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                logger.debug("collection 步骤出错 " + err);
                return callback(err);
            }
            var query = {};
            if (name) {
                query.name = name;
            }
            //根据 query 对象查询文章
            collection.find(query).sort({
                time: -1
            }).toArray(function(err, docs) {
                mongodb.close();
                if (err) {
                    logger.debug("find 步骤出错 " + err);
                    return callback(err); //失败！返回 err
                }
                logger.info(docs);
                //解析 markdown 为 html
                docs.forEach(function(doc) {
                    doc.post = markdown.toHTML(doc.post);
                });
                callback(null, docs); //成功！以数组形式返回查询的结果
            });
        });
    });
};

// getTen
Post.getTen = function(name, page, callback) {
    mongodb.open(function(err, db) {
        if (err) {
            logger.debug("open 步骤出错 " + err);
            return callback(err);
        }
        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            var query = {};
            if (name) {
                query.name = name;
            }
            collection.count(query, function(err, total) {
                // 根据 query 对象查询，并跳过前 (page-1)*10 个结果，返回之后的 10 个结果
                collection.find(query, {
                    skip: (page - 1) * 10,
                    limit: 10
                }).sort({
                    time: -1
                }).toArray(function(err, docs) {
                    mongodb.close();
                    if (err) {
                        return callback(err);
                    }
                    docs.forEach(function(doc) {
                        doc.post = markdown.toHTML(doc.post);
                    });
                    logger.info(JSON.stringify(docs));
                    callback(null, docs, total);
                });
            });
        });
    });
};

// getOne
Post.getOne = function(name, day, title, callback) {
    mongodb.open(function(err, db) {
        if (err) {
            logger.debug("open 步骤出错 " + err);
            return callback(err);
        }
        db.collection('posts', function(err, collection) {
            // 处理错误
            if (err) {
                mongodb.close();
                logger.debug("collection 步骤出错 " + err);
                callback(err);
            }
            collection.findOne({
                "name": name,
                "time.day": day,
                "title": title
            }, function(err, doc) {
                if (err) {
                    logger.debug("findOne 步骤出错 " + err);
                    mongodb.close();
                    return callback(err);
                }
                logger.info(JSON.stringify(doc));
                if (doc) {
                    collection.update({
                        "name": name,
                        "time.day": day,
                        "title": title
                    }, {
                        $inc: { "pv": 1 }
                    }, function(err) {
                        mongodb.close();
                        if (err) {
                            logger.debug("添加pv计数出错");
                            return callback(err);
                        }
                    });
                    doc.post = markdown.toHTML(doc.post);
                    doc.comments.forEach(function(comment) {
                        comment.content = markdown.toHTML(comment.content);
                    });
                }
                callback(null, doc);
            });
        });
    });
};

// edit
Post.edit = function(name, day, title, callback) {
    logger.info('edit post in mongodb start');
    mongodb.open(function(err, db) {
        if (err) {
            logger.debug("open 步骤出错 " + err);
            return callback(err);
        }
        db.collection('posts', function(err, collection) {
            if (err) {
                logger.debug("collection 步骤出错 " + err);
                mongodb.close();
                return callback(err);
            }
            collection.findOne({
                "name": name,
                "time.day": day,
                "title": title
            }, function(err, doc) {
                mongodb.close();
                if (err) {
                    logger.debug("findOne 步骤出错 " + err);
                    return callback(err);
                }
                logger.info("doc is" + JSON.stringify(doc));
                callback(null, doc);
            });
        });
    });
};

// update
Post.update = function(name, day, title, post, callback) {
    logger.info('update post in mongodb start');
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            collection.update({
                "name": name,
                "time.day": day,
                "title": title
            }, {
                $set: { post: post }
            }, function(err) {
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
Post.remove = function(name, day, title, callback) {
    logger.info('remove post start');
    mongodb.open(function(err, db) {
        if (err) {
            logger.debug("open 步骤出错 " + err);
            return callback(err);
        }
        db.collection('posts', function(err, collection) {
            if (err) {
                logger.debug("collection 步骤出错 " + err);
                mongodb.close();
                return callback(err);
            }
            collection.findOne({
                "name": name,
                "time.day": day,
                "title": title
            }, function(err, doc) {
                if (err) {
                    mongodb.close();
                    return callback(err);
                }
                var reprint_from = doc.reprint_info.reprint_from ? doc.reprint_info.reprint_from : '';
                if (reprint_from !== '') {
                    collection.update({
                        "name": reprint_from.name,
                        "time.day": reprint_from.day,
                        "title": reprint_from.title
                    }, {
                        $pull: {
                            "reprint_info.reprint_to": {
                                "name": name,
                                "day": day,
                                "title": title
                            }
                        }
                    }, function(err) {
                        if (err) {
                            mongodb.close();
                            return callback(err);
                        }
                    });
                };
                collection.remove({
                    "name": name,
                    "time.day": day,
                    "title": title
                }, {
                    w: 1
                }, function(err) {
                    mongodb.close();
                    if (err) {
                        logger.debug("remove 步骤出错 " + err);
                        return callback(err);
                    }
                    callback(null);
                });
            });
        });
    });
};

// getArchive
Post.getArchive = function(callback) {
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            // 返回只有 name、time、title 属性组成的文档数组
            collection.find({}, {
                "name": 1,
                "time": 1,
                "title": 1
            }).sort({ time: -1 }).toArray(function(err, docs) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};

// getAllTags
Post.getTags = function(callback) {
    mongodb.open(function(err, db) {
        if (err) {
            logger.debug("open步骤出错!");
            return callback(err);
        }
        db.collection('posts', function(err, collection) {
            if (err) {
                logger.debug("collection 步骤出错！");
                mongodb.close();
                return callback(err);
            }
            collection.distinct('tags', function(err, docs) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};

// getPostsByTag
Post.getTag = function(tag, callback) {
    mongodb.open(function(err, db) {
        if (err) {
            logger.debug("open 步骤出错 " + err);
            return callback(err);
        }
        db.collection('posts', function(err, collection) {
            // 处理错误
            if (err) {
                mongodb.close();
                logger.debug("collection 步骤出错 " + err);
                callback(err);
            }
            collection.find({
                "tags": tag
            }, {
                "name": 1,
                "time": 1,
                "title": 1
            }).sort({
                time: -1
            }).toArray(function(err, docs) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};

// 搜索
Post.search = function(keyword, callback) {
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            var pattern = new RegExp(keyword, 'i');
            collection.find({
                "title": pattern
            }, {
                "name": 1,
                "time": 1,
                "title": 1
            }).sort({
                time: -1
            }).toArray(function(err, docs) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};

//转载一篇文章
Post.reprint = function(reprint_from, reprint_to, callback) {
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //找到被转载的文章的原文档
      collection.findOne({
        "name": reprint_from.name,
        "time.day": reprint_from.day,
        "title": reprint_from.title
      }, function (err, doc) {
        if (err) {
          mongodb.close();
          return callback(err);
        }

        var date = new Date();
        var time = {
            date: date,
            year : date.getFullYear(),
            month : date.getFullYear() + "-" + (date.getMonth() + 1),
            day : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
            minute : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
            date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
        }

        delete doc._id;//注意要删掉原来的 _id

        doc.name = reprint_to.name;
        doc.head = reprint_to.head;
        doc.time = time;
        doc.title = (doc.title.search(/[转载]/) > -1) ? doc.title : "[转载]" + doc.title;
        doc.comments = [];
        doc.reprint_info = {"reprint_from": reprint_from};
        doc.pv = 0;

        //更新被转载的原文档的 reprint_info 内的 reprint_to
        collection.update({
          "name": reprint_from.name,
          "time.day": reprint_from.day,
          "title": reprint_from.title
        }, {
          $push: {
            "reprint_info.reprint_to": {
              "name": doc.name,
              "day": time.day,
              "title": doc.title
          }}
        }, function (err) {
          if (err) {
            mongodb.close();
            return callback(err);
          }
        });

        //将转载生成的副本修改后存入数据库，并返回存储后的文档
        collection.insert(doc, {
          safe: true
        }, function (err, post) {
          mongodb.close();
          if (err) {
            return callback(err);
          }
          callback(null, post.ops[0]);
        });
      });
    });
  });
};
