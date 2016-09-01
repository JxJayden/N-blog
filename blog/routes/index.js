var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var flash = require('connect-flash');
var User = require('../models/user');
var logger = require('log4js').getLogger("router");
var Post = require('../models/post.js');
var multer  = require('multer');

// 上传文件的方法 destination：文件保存的地方，filename：文件名
var storage = multer.diskStorage({
    destination: function (req, file, cb){
        cb(null, './public/upload_images');
    },
    filename: function (req, file, cb){
        cb(null, file.originalname);
    }
});
var upload = multer({
    storage: storage
});

/* 主页 */
router.get('/', function(req, res) {
    var currentUserName;
    logger.info('user is: '+JSON.stringify(req.session.user));
    if (req.session.user) {
        currentUserName = req.session.user.name;
        Post.get(currentUserName, function(err, posts) {
        if (err) {
            logger.debug(err);
            posts = [];
        }
        logger.info('文章：'+JSON.stringify(posts));
        res.render('index', {
            title: '主页',
            user: req.session.user,
            posts: posts,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    } else{
        res.render('index', {
            title: '主页',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    }


});

/* 上传文件页面 */
router.get('/upload',checkLogin);
router.get('/upload',function(req,res) {
    res.render('upload',{
        title:'文件上传',
        user:req.session.user,
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
    var currentUser = req.session.user;
    var post = new Post(currentUser.name, req.body.title, req.body.post)
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
router.post('/upload',checkLogin);
router.post('/upload',upload.single('field'),function(req,res){
     req.flash('success', '文件上传成功!');
     res.redirect('/upload');
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


