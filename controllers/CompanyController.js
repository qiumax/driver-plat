var mongoose = require("mongoose")
var Company = require("../models/Company")
var CosUploader = require("../models/CosUploader")
var Config = require("../config/Config")
var dateformat = require("dateformat")


var companyController = {}

companyController.all = function(req, res) {
    var page = req.query.page || 1
    var page_size = req.query.page_size || req.app.get('config').page_size
    console.log(req.session)
    Company.count({deleted: false}, function(err, count) {
        if(err) throw err
    
        Company.find({deleted: false}).sort({created_at:-1}).skip((page-1)*page_size).limit(page_size).then(companys=>{
            companys.forEach(company=>{
                company.create_time = dateformat(company.created_at, 'yyyy/mm/dd HH:MM')
            })
            
            /*
            console.log({
                count: count,
                companys: companys,
                page: page,
                page_total: Math.floor(count/page_size)+1
            });
            */
            console.log(companys)
            res.render('company', {
                companys: companys,
	            username:req.session.passport.user,
                page: page,
                page_total: Math.floor(count/page_size)+1
            })
        })
    })
}

companyController.search = function(req, res) {
    var query = req.body.query
	
	var pattern = query
    var reg = {$regex: pattern, $options:"i"}
	
    Company.find({
		$or: [
			{username: reg},
			{name: reg},
            {contact_name: reg},
            {contact_phone: reg}
		]
	}).then(companys=>{
	    console.log(companys);
        companys.forEach(company=>{
            company.create_time = dateformat(company.created_at, 'yyyy/mm/dd HH:MM')
        })
        res.render('company', {
	        username:req.session.passport.user,
            companys: companys
        })
    })
}

companyController.edit = function(req, res) {
	var id = req.query.id;
	Company.findById(id).then(company=>{
		console.log(company);
		company.license_image = company.license_image+"?"+Math.random()*9999
		res.render('company_edit', {
			username:req.session.passport.user,
			company: company
		})
	})
}

companyController.check_username = function (req, res) {
	Company.findOne({username: req.body.username}).then(company=>{
		if(company){
			res.send({ok: 0});
		}
		else {
            res.send({ok: 1});
		}
	})
}

companyController.add = function(req, res) {
	console.log(req.files)

	var file = req.files.license_image
	var body = req.body
    
    Company.findOne({username: req.body.username}).then(company=>{
        if(company){
            res.send({ok: 0})
			return
        }
    
        Company.register(new Company({
            username: body.username,
            // password: body.password,
            contact_name: body.contact_name,
            contact_phone: body.contact_phone,
            name: body.name,
            address: body.address,
            license_number: body.license_number,
            price_dun: body.price_dun,
            price_fang: body.price_fang,
	        price_peizai:body.price_peizai,
	        price_zhengche:body.price_zhengche,
	        price_chaoxian:body.price_chaoxian,
            state: true,
            deleted: false
        }), req.body.password, function (err, company) {
            if(!err){
                if(file.size>0) {
                    var tmp_path = file.path
                    var key = "companys/" + company._id.toString()+".png"
                    
                    CosUploader.uploadFile(tmp_path, key, function () {
                        if(err) throw err
                       
                        var image_src = Config.cos.host + '/' + key;
                        company.license_image = image_src
                        company.save( function( err ){
                            res.send('/api/company/all')
                        })
                    })
                }
            }
        })
    })
}

companyController.update = function(req, res) {
	console.log(req.files)
	var id = req.body.id
	var file = req.files.license_image
	var body = req.body

	Company.findById(id).then(company=>{
		if(!company) return

		company.name = body.name;
		company.address = body.address;
		company.license_number = body.license_number;
		company.contact_name = body.contact_name;
		company.contact_phone = body.contact_phone;
		company.price_dun = body.price_dun;
		company.price_fang = body.price_fang;
		company.price_peizai = body.price_peizai,
		company.price_zhengche = body.price_zhengche,
		company.price_chaoxian = body.price_chaoxian,
		company.state = body.state;
  
		company.save( function( err ){

			if(!err){
			    var pwd = body.password
			    if(pwd) {
                    company.setPassword(pwd, function () {
                        company.save(function( err ){
                            if(err) throw err
                        })
                    })
                }
			    
				if(file.size>0) {
                    var tmp_path = file.path
                    var key = "companys/" + company._id.toString()+".png"
                    
                    CosUploader.uploadFile(tmp_path, key, function () {
                        if(err) throw err
                        
                        var image_src = Config.cos.host + '/' + key;
                        company.license_image = image_src

                        company.save( function( err ){
	                        console.log('*****')
                            res.send('/api/company/edit?id=' + id)
                        })
                    })
				}
				else{
					res.send('/api/company/edit?id=' + id)
				}
			}
		})
	})
}

companyController.delete = function(req, res) {
    var id = req.body.id
    Company.findByIdAndUpdate(id, {deleted: true}, {new:true}).then((company, err)=>{
        console.log(company)
        console.log(err)
        
        if(company.deleted) {
            res.send({ok:1})
        }
    })
}

module.exports = companyController
