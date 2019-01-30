var express = require('express');
var router = express.Router();
var companyController = require("../controllers/CompanyController.js");

var mutipart= require('connect-multiparty');
var mutipartMiddeware = mutipart();

auth = function (req, res, next) {
    if (req.session.passport.role == 1) {
        console.log("有权限");
        return next();
    } else {
        return next(new Error("权限不足"))
    }
}

router.get('/all', auth, companyController.all);

router.post('/search', companyController.search);

router.get('/add', function (req,res) {
	res.render('company_add');
});

router.get('/edit', companyController.edit);

router.post('/add', mutipartMiddeware, companyController.add);

router.post('/update', mutipartMiddeware, companyController.update);

router.post('/check_username', companyController.check_username);

router.post('/delete', companyController.delete);

module.exports = router;