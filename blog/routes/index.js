var express = require('express');
var router = express.Router();

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

router.post('/reg', function (req, res) {
});

router.post('/login', function (req, res) {
});

router.post('/post', function (req, res) {
});

module.exports = router;
