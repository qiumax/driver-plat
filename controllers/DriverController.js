var mongoose = require("mongoose")
var User = require("../models/User")
var Driver = require("../models/Driver")
var Cos = require("../models/Cos")
var CosUploader = require("../models/CosUploader")
var Config = require("../config/Config")
var Dateformat = require("dateformat")

var driverController = {}

driverController.all = function(req, res) {
    var page = req.query.page || 1
    var page_size = req.query.page_size || req.app.get('config').page_size
    
    Driver.count({}, function(err, count) {
        if (err) throw err
    
        Driver.find({}).sort({created_at:1}).skip((page-1)*page_size).limit(page_size).populate("user").then(drivers=>{
            drivers.forEach(driver=>{
                driver.approve_time = Dateformat(new Date(driver.approved_at*1000), 'yyyy/mm/dd HH:MM')
                if(driver.day)
                    driver.day = (driver.day).toFixed(2)
                else
                    driver.day = 0
            })
            res.render('driver', {
                drivers: drivers,
	            username:req.session.passport.user,
                page: page,
                page_total:  count%page_size==0? count/page_size:(Math.floor(count/page_size)+1)
            })
        })
    })
}



driverController.to_chushen = function(req, res) {
    var page = req.query.page || 1
    var page_size = req.query.page_size || req.app.get('config').page_size
    
    User.count({apply_driver_state:1}, function(err, count) {
        if (err) throw err
    
        User.find({apply_driver_state:1}).sort({created_at:1}).skip((page-1)*page_size).limit(page_size).then(users=>{
            users.forEach(user=>{
                user.apply_time = Dateformat(new Date(user.apply_at*1000), 'yyyy/mm/dd HH:MM')
            })
            res.render('user', {
                drivers: users,
	            username:req.session.passport.user,
                page: page,
                page_total: Math.floor(count/page_size)+1
            })
        })
    })
}

driverController.to_mianshen = function(req, res) {
    var page = req.query.page || 1
    var page_size = req.query.page_size || req.app.get('config').page_size
    
    User.count({apply_driver_state:2}, function(err, count) {
        if (err) throw err
        
        User.find({apply_driver_state:2}).sort({created_at:1}).skip((page-1)*page_size).limit(page_size).then(users=>{
            users.forEach(user=>{
                user.apply_time = Dateformat(new Date(user.apply_at*1000), 'yyyy/mm/dd HH:MM')
            })
            res.render('user', {
                drivers: users,
	            username:req.session.passport.user,
                page: page,
                page_total: Math.floor(count/page_size)+1
            })
        })
    })
}

driverController.search = function(req, res) {
    var query = req.body.query
    
    var pattern = query
    var reg = {$regex: pattern, $options:"i"}
    console.log(query)
    User.find({
        $or: [
            {name: reg},
            {phone: reg}
        ],
        apply_driver_state:3
    }).then(users=>{
        if(users && users.length>0)
        {
            var users_arr = new Array()
            users.forEach(user=>{
                    users_arr.push(user._id)
                 })
            console.log(users_arr)
            Driver.find({
                user:{$in:users_arr}
            }).populate('user').then(drivers=>{
                console.log(drivers)
                drivers.forEach(driver=>{
                    if(driver.day)
                        driver.day = (driver.day).toFixed(2)
                    else
                        driver.day = 0
                    driver.create_time = Dateformat(driver.created_at, 'yyyy/mm/dd hh:MM')
                    driver.approve_time = Dateformat(new Date(driver.approved_at*1000), 'yyyy/mm/dd hh:MM')
                })

                res.render('driver', {
                    username:req.session.passport.user,
                    drivers: drivers
                })
            })
        }
        else
        {
            res.render('driver', {
                username:req.session.passport.user,
                drivers: []
            })
        }
    })

}

driverController.edit = function(req, res) {
    var id = req.query.id
    Driver.findById(id).populate('user').then(driver=>{
        console.log(driver)
        res.render('driver_edit', {
	        username:req.session.passport.user,
            driver: driver
        })
    })
}

driverController.driver_update = function(req, res) {
	console.log(req.body)
    var driver_id = req.body.driver_id
    var state = req.body.state
	console.log(req.body)
    Driver.findByIdAndUpdate(driver_id, {state: state}, {new:true}).then(driver=>{
        console.log(driver)
        res.redirect('/api/driver/edit?id='+driver_id)
    })
}

driverController.approve = function(req, res) {
    var id = req.query.id
    User.findById(id).then(driver=>{
        console.log(driver)
        res.render('driver_approve', {
	        username:req.session.passport.user,
            driver: driver
        })
    })
}

driverController.approve_update = function(req, res) {
    var user_id = req.body.user_id
    
    var apply_driver_state = req.body.apply_driver_state
    console.log(apply_driver_state)
	if(apply_driver_state==1)
		apply_driver_state=2
	else if(apply_driver_state==2)
		apply_driver_state=3
    User.findByIdAndUpdate(req.body.user_id, {
        gender: req.body.gender,
        province: req.body.province,
        city: req.body.city,
        apply_driver_state: apply_driver_state
    }).then(user=>{
        console.log(user)
        
        if(apply_driver_state==3) {
            
            Driver.findOne({user: user_id}).then(driver=>{
                if(driver) {
                    driver.approved_at = new Date().getTime()/1000
                    driver.state = 1
                    driver.in_service = false
                }
                else {
                    var driver = new Driver({
                        user: user._id,
                        approved_at: new Date().getTime()/1000,
                        state: 1,
                        in_service: false,
	                    distance:0,
	                    day:0,
	                    num:0,
	                    star:5,
	                    comment_num:1
                    })
                }
                driver.save(function (err) {
                    if(err) {
                        console.log(err);
	                    res.redirect('/api/driver/all')
                    }
	                res.redirect('/api/driver/all')
                })
            })
        }
        else {
	        res.redirect('/api/driver/all')
        }
    })
}

/*
driverController.apply = function(req, res) {
    console.log(req.files)
    
    var files = req.files
    var body = req.body
    
    Driver.findOne({username: req.body.username}).then(driver=>{
        if(!driver) return
        
        files.forEach(function (file) {
            if(file.size>0) {
                var tmp_path = file.path
                var field_name = file.fieldName
                var key = "drivers/" + field_name + "_" + driver._id.toString()
    
                CosUploader.uploadFile(tmp_path, key, function () {
                    var image_src = Config.cos.host + '/' + key;
                    company[field_name] = image_src
                    company.save()
                })
            }
        })
    
        driver.id = body.id
        driver.name = body.name
        driver.phone = body.phone
        
        drive.save( function( err ){
            if(err) throw err
            res.send({ok:1})
        })
    })
}
*/

module.exports = driverController
