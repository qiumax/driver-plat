var mongoose = require("mongoose")
var Truck = require("../models/Truck")
var CosUploader = require("../models/CosUploader")
var Config = require("../config/Config")
var dateformat = require("dateformat")

var truckController = {}

truckController.all = function(req, res) {
    var page = req.query.page || 1
    var page_size = req.query.page_size || req.app.get('config').page_size
    
    Truck.count({deleted: false}, function(err, count) {
        if(err) throw err
    
        Truck.find({deleted: false}).sort({created_at:1}).skip((page-1)*page_size).limit(page_size).then(trucks=>{
            trucks.forEach(truck=>{
                truck.create_time = dateformat(truck.created_at, 'yyyy/mm/dd hh:MM')
            })
            
            res.render('truck_all', {
                trucks: trucks,
	            username:req.session.passport.user,
                page: page,
                page_total: Math.floor(count/page_size)+1
            })
        })
    })
}

truckController.search = function(req, res) {
    var query = req.body.query
	
	var pattern = query
    var reg = {$regex: pattern, $options:"i"}
	
    Truck.find({
        name: reg
    }).then(trucks=>{
	    console.log(trucks);
        trucks.forEach(truck=>{
            truck.create_time = dateformat(truck.created_at, 'yyyy/mm/dd hh:MM')
        })
        res.render('truck_all', {
	        username:req.session.passport.user,
            trucks: trucks
        })
    })
}

truckController.edit = function(req, res) {
	var id = req.query.id;
	Truck.findById(id).then(truck=>{
		console.log(truck);
		res.render('truck_edit', {
			username:req.session.passport.user,
			truck: truck
		})
	})
}

truckController.add = function(req, res) {
	console.log(req.files)

	var file = req.files.img
	var body = req.body
    
    var truck = new Truck({
        name: body.name,
        load: body.load,
        size: body.size,
        volume: body.volume,
        deleted: false
    })
    
    truck.save(function (err) {
        if(err) throw err
        if(file.size>0) {
            var tmp_path = file.path
            var key = "trucks/" + truck._id.toString()
        
            CosUploader.uploadFile(tmp_path, key, function () {
                if(err) throw err
            
                var image_src = Config.cos.host + '/' + key;
                truck.img = image_src
                truck.save( function( err ){
                    res.send('/api/truck/all')
                })
            })
        }
    })
}

truckController.update = function(req, res) {
	console.log(req.files)

	var id = req.body.id
	var file = req.files.img
	var body = req.body

	Truck.findById(id).then(truck=>{
		if(!truck) return

		truck.name = body.name;
		truck.load = body.load;
		truck.size = body.size;
		truck.volume = body.volume;
  
		truck.save( function( err ){
		    if(err) throw err
            
            var pwd = body.password
            if(pwd) {
                truck.setPassword(pwd, function () {
                    truck.save(function( err ){
                        if(err) throw err
                    })
                })
            }
            
            if(file.size>0) {
                var tmp_path = file.path
                var key = "trucks/" + truck._id.toString()
                
                CosUploader.uploadFile(tmp_path, key, function () {
                    if(err) throw err
                    
                    var image_src = Config.cos.host + '/' + key;
                    truck.img = image_src
                    truck.save( function( err ){
                        res.send('/api/truck/edit?id=' + id)
                    })
                })
            }
            else{
                res.send('/api/truck/edit?id=' + id)
            }
		})
	})
}

truckController.delete = function(req, res) {
    console.log("1111");
    var id = req.body.id
    Truck.findByIdAndUpdate(id, {deleted:true}, {new:true}).then((truck, err)=>{
        console.log(truck)
        console.log(err)
        
        if(truck.deleted) {
            res.send({ok:1})
        }
    })
}

module.exports = truckController
