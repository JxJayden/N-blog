var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var flash = require('connect-flash');
var User = require('../models/user');

/* 主页 */
router.get('/', function(req, res) {
  res.render('index', { title: '主页' });
});

/* 注册 */
router.get('/reg', function(req, res) {
  res.render('reg', { title: '注册' });
});

/* 登录 */
router.get('/login', function(req, res, next) {
  res.render('login', { title: '登录' });
});

/* 退出 */
router.get('/logout', function(req, res, next) {
});

/*发送注册请求*/
router.post('/reg', function (req, res) {
 var name = req.body.name;
 var password = req.body.password;
 var password_re = req.body['password-repeat'];
 var email = req.body.email;

// 检验是否有未输入的数据
if (name =='' || password =='' || password_re =='' || email =='' ) {
 req.flash('error','请填写所有项目。');
 return res.redirect('/reg'); // 重定向到注册页
}
// 检验用户两次输入的密码是否一致
if (password_re != password) {
 req.flash('error','两次输入的密码不一致');
 return res.redirect('/reg'); // 重定向到注册页
}

// 生成密码的 md5 值
var md5 = crypto.createHash('md5');
password = md5.update(password).digest('hex');
var newUser = new User({
 name:name,
 password:password,
 email:email
});

// 检查用户名是否已经存在
User.get(newUser.name,function(err,user){
 if (err) {
    req.flash('error', err);
    return res.redirect('/');
 }
 if (user) {
   req.flash('error', '用户已存在!');
   return res.redirect('/reg'); // 重定向到注册页
 }

 // 如果不存在则新增用户
 newUser.save(function(err,user){
  if (err) {
   logger.debug('error is '+err);
    req.flash('error', err);
    return res.redirect('/reg'); // 注册失败返回主册页
  }
  req.session.user = newUser;//用户信息存入 session
  req.flash('success', '注册成功!将返回主页。');
  res.redirect('/');//注册成功后返回主页
 });
});
});

router.post('/login', function (req, res) {
});

router.post('/post', function (req, res) {
});

module.exports = router;
