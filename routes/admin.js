var express = require('express');
var router = express.Router();
var adminController = require("../controllers/AdminController.js");
var passport = require('passport');

router.post('/register', adminController.register)

router.post('/reset_pwd', adminController.reset_pwd)

router.post('/login', passport.authenticate('local', {
    // successRedirect:'/api/index',
    failureRedirect: '/admin/login',
    failureFlash: true
}), function (req, res) {
    console.log('login success');
    req.session.passport.role = 1;
    console.log('session:');
    console.log(req.session);

    res.redirect('/api/index');
})

router.get('/logout',function (req,res) {
	console.log(req.session)
	req.session.destroy(function(err) {
		if(err){
			return;
		}
		console.log(req.session)
		res.redirect('/admin/login')
	});
})
router.get('/login', function (req, res) {
    var msg = req.flash('error');
    console.log(msg);
    res.render('login', {message: msg});
})

router.get('/register', function (req, res) {
    res.render('register');
})

module.exports = router;
