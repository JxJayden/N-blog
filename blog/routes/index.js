var express = require('express'),
    router = express.Router(),
    crypto = require('crypto'),
    flash = require('connect-flash'),
    User = require('../models/user'),
    logger = require('log4js').getLogger("router"),
    Post = require('../models/post.js'),
    Comment = require('../models/comment.js'),
    multer = require('multer');

// 上传文件的方法 destination：文件保存的地方，filename：文件名
var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './public/upload_images');
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname);
    }
});
var upload = multer({
    storage: storage
});

/* 主页 */
router.get('/', function(req, res) {
    var page = parseInt(req.query.p) || 1;
    Post.getTen(null, page, function(err, posts, total) {
        if (err) {
            post = [];
        }
        res.render('index', {
            title: '主页',
            posts: posts,
            page: page,
            isFirstPage: (page - 1) == 0,
            isLastPage: ((page - 1) * 10 + posts.length) == total,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});

/* 上传文件页面 */
router.get('/upload', checkLogin);
router.get('/upload', function(req, res) {
    res.render('upload', {
        title: '文件上传',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });
});

/* 注册页面 */
router.get('/reg', checkNotLogin);
router.get('/reg', function(req, res) {
    logger.info(req.session);
    res.render('reg', {
        title: '注册',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });
});

/* 登录页面 */
router.get('/login', checkNotLogin);
router.get('/login', function(req, res, next) {
    res.render('login', {
        title: '登录',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });
});

/* 发表页面 */
router.get('/post', checkLogin);
router.get('/post', function(req, res) {
    res.render('post', {
        title: '发表',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });
});

/* 根据name跳到个人主页 */
router.get('/u/:name', function(req, res) {
    var page = parseInt(req.query.p) || 1;
    User.get(req.params.name, function(err, user) {
        if (!user) {
            req.flash('error', '用户不存在!');
            return res.redirect('/'); //用户不存在则跳转到主页
        }
        //查询并返回该用户第 page 页的 10 篇文章
        Post.getTen(user.name, page, function(err, posts, total) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('user', {
                title: user.name,
                posts: posts,
                page: page,
                isFirstPage: (page - 1) == 0,
                isLastPage: ((page - 1) * 10 + posts.length) == total,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
});

/* 文章详情页 */
router.get('/u/:name/:day/:title', function(req, res) {
    Post.getOne(req.params.name, req.params.day, req.params.title, function(err, post) {
        if (err) {
            req.flash('error', err);
            return res.redirect('/');
        }
        res.render('article', {
            title: req.params.title,
            post: post,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});

/* 编辑页面 */
router.get('/edit/:name/:day/:title', checkLogin);
router.get('/edit/:name/:day/:title', function(req, res) {
    logger.debug('跳转到编辑页面');
    var currentUser = req.session.user;
    Post.edit(currentUser.name, req.params.day, req.params.title, function(err, post) {
        if (err) {
            req.flash('error', err);
            return res.redirect('back');
        }
        res.render('edit', {
            title: '编辑',
            post: post,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});

/* 归档页面 */
router.get('/archive', function(req, res) {
    Post.getArchive(function(err, posts) {
        if (err) {
            req.flash('error', err);
            req.redirect('/');
        }
        res.render('archive', {
            title: '归档',
            posts: posts,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});

/* 删除 */
router.get('/remove/:name/:day/:title', checkLogin);
router.get('/remove/:name/:day/:title', function(req, res) {
    var currentUser = req.session.user;
    Post.remove(currentUser.name, req.params.day, req.params.title, function(err) {
        if (err) {
            req.flash('error', err);
            return res.redirect('back');
        }
        req.flash('success', '删除成功！');
        res.redirect('/');
    });
});

/* 标签页面 */
router.get('/tags',function (req,res) {
    Post.getTags(function(err,posts){
        if (err) {
            res.flash('error',err);
            return res.redirect('/');
        }
        res.render('tags',{
            title: "标签",
            posts: posts,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});

/* 标签对应的文章列表页面 */
router.get('/tags/:tag',function(req,res){
    Post.getTag(req.params.tag,function(err,posts) {
        if (err) {
            req.flash('error',err);
            return res.redirect('/');
        }
        res.render('tag',{
          title: 'TAG '+req.params.tag,
          posts: posts,
          user:req.session.user,
          success: req.flash('success').toString(),
          error: req.flash('error').toString()
        });
    });
});

/* 退出 */
//通过把 req.session.user 赋值 null ，实现用户的退出。
router.get('/logout', checkLogin);
router.get('/logout', function(req, res) {
    req.session.user = null;
    logger.info('登出成功！');
    req.flash('success', '登出成功！');
    res.redirect('/');
});

/*发送注册请求*/
router.post('/reg', checkNotLogin);
router.post('/reg', function(req, res) {
    var name = req.body.name;
    var password = req.body.password;
    var password_re = req.body['password-repeat'];
    var email = req.body.email;

    // 检验是否有未输入的数据
    if (name == '' || password == '' || password_re == '' || email == '') {
        req.flash('error', '请填写所有项目。');
        return res.redirect('/reg'); // 重定向到注册页
    }
    // 检验用户两次输入的密码是否一致
    if (password_re != password) {
        req.flash('error', '两次输入的密码不一致');
        return res.redirect('/reg'); // 重定向到注册页
    }

    // 生成密码的 md5 值
    var md5 = crypto.createHash('md5');
    password = md5.update(password).digest('hex');
    var newUser = new User({
        name: name,
        password: password,
        email: email
    });

    // 检查用户名是否已经存在
    User.get(newUser.name, function(err, user) {
        if (err) {
            req.flash('error', err);
            return res.redirect('/');
        }
        if (user) {
            req.flash('error', '用户已存在!');
            return res.redirect('/reg'); // 重定向到注册页
        }

        // 如果不存在则新增用户
        newUser.save(function(err, user) {
            if (err) {
                logger.info('error is ' + err);
                req.flash('error', err);
                return res.redirect('/reg'); // 注册失败返回主册页
            }
            req.session.user = newUser; //用户信息存入 session
            logger.debug(req.session);
            req.flash('success', '注册成功!');
            res.redirect('/'); //注册成功后返回主页
        });
    });
});

/* 发送登录请求 */
router.post('/login', checkNotLogin);
router.post('/login', function(req, res) {
    // 生成密码的 md5 值
    var md5 = crypto.createHash('md5');
    var password = md5.update(req.body.password).digest('hex');

    //检查用户是否存在
    User.get(req.body.name, function(err, user) {
        if (!user) {
            req.flash('error', '用户不存在!');
            return res.redirect('/login'); //不存在则跳到登录页
        }

        //检查密码是否一致
        if (user.password != password) {
            req.flash('error', '密码错误!');
            return res.redirect('/login'); //密码错误则跳转到登录页
        }

        // 用户名和密码都匹配后，将用户信息存入 session
        req.session.user = user;
        req.flash('success', '登录成功！');
        res.redirect('/');
    })
});

/* 发表文章 */
router.post('/post', checkLogin);
router.post('/post', function(req, res) {
    var currentUser = req.session.user,
        tags = [req.body.tag1, req.body.tag2, req.body.tag3],
        post = new Post(currentUser.name, req.body.title, tags, req.body.post);
    post.save(function(err) {
        if (err) {
            req.flash('error', err);
            return res.redirect('');
        }
        req.flash('success', '发布成功!');
        res.redirect('/'); //发表成功跳转到主页
    });
});

/* 发送上传文件请求 */
router.post('/upload', checkLogin);
router.post('/upload', upload.single('field'), function(req, res) {
    req.flash('success', '文件上传成功!');
    res.redirect('/upload');
});

/* 发送编辑文章请求 */
router.post('/edit/:name/:day/:title', checkLogin);
router.post('/edit/:name/:day/:title', function(req, res) {
    logger.debug('发送编辑文章请求');
    var currentUser = req.session.user;
    Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, function(err) {
        var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title);
        if (err) {
            req.flash('error', err);
            return res.redirect(url);
        }
        req.flash('success', '修改成功！');
        return res.redirect(url);
    });
});
/* 发送留言请求 */
router.post('/u/:name/:day/:title', function(req, res) {
    var date = new Date(),
        time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
    var comment = {
        name: req.body.name,
        email: req.body.email,
        website: req.body.website,
        time: time,
        content: req.body.content
    };
    logger.debug(JSON.stringify(comment));
    var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
    newComment.save(function(err) {
        if (err) {
            req.flash('error', err);
            return res.redirect('back');
        }
        req.flash('success', '修改成功！');
        res.redirect('back');
    });
});
module.exports = router;


// 检查登录
function checkLogin(req, res, next) {
    if (!req.session.user) {
        logger.info('未登录');
        req.flash('error', '未登录!');
        res.redirect('/login');
    }
    next();
}

// 检查未登录
function checkNotLogin(req, res, next) {
    if (req.session.user) {
        logger.info('已登录');
        req.flash('error', '已登录!');
        res.redirect('back');
    }
    next();
}
