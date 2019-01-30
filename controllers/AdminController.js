var mongoose = require("mongoose");
var Admin = require("../models/Admin");

var adminController = {};

adminController.register = function(req, res) {
    console.log(req.body);
    Admin.register(new Admin({ username: req.body.username }), req.body.password, function (err, admin) {
        if(err) res.send(err);
        else res.send(admin);
    })
};

adminController.reset_pwd = function(req, res) {
    console.log(req.body);
    var username = req.body.username
    var pwd = req.body.pwd
    Admin.findOne({
        username: username
    }).then(admin=>{
        admin.setPassword(pwd, function () {
            admin.save(function( err ){
                if(err) throw err
                res.send(admin);
            })
        })
    })
};

module.exports = adminController;
