var mongoose = require("mongoose");
var Order = require("../models/Order");
var Driver = require("../models/Driver");
var Account = require("../models/Account");
var Company = require("../models/Company");
var Dateformat = require("dateformat");
var moment = require("moment");
var async = require('async')
var Config = require("../config/Config")

var serviceController = {};

serviceController.handle = function(req, res) {
	var page = req.query.page || 1
	var page_size = req.query.page_size || req.app.get('config').page_size

	Order.countDocuments({
        state:5
	}, function(err, count) {
		if (err) throw err
		console.log(count)
		Order.find({
			state:5
		}).sort({created_at:-1}).skip((page-1)*page_size).limit(page_size).populate({
			path: 'driver',
			model: 'Driver',
			populate: {
				path: 'user',
				model: 'User'
			}
		}).populate({
			path: 'account',
			model: 'Account',
			populate: {
				path: 'company',
				model: 'Company'
			}
		}).then(orders=>{
			orders.forEach(order=>{
				order.created_time = moment(order.created_at).format('YYYY-MM-DD HH:mm:ss')
				order.publish_time = Dateformat(new Date(order.publish_at*1000),'yyyy-mm-dd HH:MM')
			})
			res.render('service', {
				orders: orders,
				username:req.session.passport.user,
				page: page,
				page_total: count%page_size==0? count/page_size:(Math.floor(count/page_size)+1)
			})
		})
	})
};

serviceController.update = function (req,res) {
	var price = req.body.price
	var order_id = req.body.order_id
	var content = req.body.content
	var files = req.files.tousuimgs
	var pics = new Array()
	console.log(req.files)
	async.map(files,function (file,cb) {
		console.log('---')
		console.log(file)
		if(file.size>0) {
			var tmp_path = file.path
			console.log('file.path')
			var key = "tousus/" + order_id+ "/handletousu"+ Math.random() *99999+".png"
			console.log('key')
			console.log(key)
			CosUploader.uploadFile(tmp_path, key, function (err,data) {
				if(err) throw err
				var img = Config.cos.host + '/' + key;
				pics.push(img)
				console.log(img)
				cb(null,img)

			})
		}
	},function (err,pics) {
		console.log('pics')
		console.log(pics)
		Order.findById(order_id).then(order=>{
			var plat_handle_tousu= new Array()
			plat_handle_tousu ={
				content:content,
				time:new Date().getTime()/1000,
				pics:pics
			}
			order.plat_handle_tousu = plat_handle_tousu
			order.state = 6
			order.save(function (err) {
				if(err) throw err
				//更新driver
                var distance = order.distance
                var star = order.comment_to_driver.points
                var day = (new Date().getTime()/1000 - order.driver_confirm_cargo_at.time)/(60*60*24)

                Driver.findByIdAndUpdate(
                    order.driver,
                    {
                        in_service: false,
                        current_order: null
                    },
                    {new: true},
                    function (err, driver) {
                        if(err) throw err
                        if(!driver.distance){
                            driver.distance = 0
                        }
                        if(!driver.day){
                            driver.day = 0
                        }
                        if(!driver.num){
                            driver.num = 0
                        }
                        driver.num = driver.num + 1
                        driver.day = driver.day + day
                        driver.distance = driver.distance + distance
                        driver.save(function (err) {
                            if(err) throw err
							//生成收支记录
							
                            res.send('/api/service/detail?id=' + order_id)
                        })

                    }
                )


			})

		})

	})
	

}

serviceController.finish = function(req, res) {
	var page = req.query.page || 1
	var page_size = req.query.page_size || req.app.get('config').page_size

	Order.countDocuments({
		state:6
	}, function(err, count) {
		if (err) throw err
		console.log(count)
		Order.find({
			state:6
		}).sort({created_at:-1}).skip((page-1)*page_size).limit(page_size).populate({
			path: 'driver',
			model: 'Driver',
			populate: {
				path: 'user',
				model: 'User'
			}
		}).populate({
			path: 'account',
			model: 'Account',
			populate: {
				path: 'company',
				model: 'Company'
			}
		}).then(orders=>{
			orders.forEach(order=>{
				order.created_time = moment(order.created_at).format('YYYY-MM-DD HH:mm:ss')
				order.publish_time = Dateformat(new Date(order.publish_at*1000),'yyyy-mm-dd hh:MM')
			})
			res.render('service', {
				orders: orders,
				username:req.session.passport.user,
				page: page,
				page_total: count%page_size==0? count/page_size:(Math.floor(count/page_size)+1)
			})
		})
	})
};

serviceController.detail = function (req,res) {
		var order_id = req.query.id
		console.log(order_id)
		Order.findById(order_id).populate({
			path: 'driver',
			model: 'Driver',
			populate: {
				path: 'user',
				model: 'User'
			}
		}).populate({
			path: 'account',
			model: 'Account',
			populate: {
				path: 'company',
				model: 'Company'
			}
		}).then(order=>{

			var mtime = Dateformat(new Date(order.time * 1000), 'yyyy/mm/dd HH:MM')
			order.sendtime = mtime

			//logs
			var logs = new Array()
			//发单
			if(order.created_at)
			{
				logs.push(moment(order.created_at).format('YYYY-MM-DD HH:mm:ss') + '： 提交运单')
			}

			//接单
			if(order.publish_at)
			{
				logs.push(Dateformat(new Date(order.publish_at*1000), 'yyyy-mm-dd HH:mm:ss') +'： 司机接单')
			}
			if(order.driver_confirm_cargo_at.time){
				logs.push(moment(order.driver_confirm_cargo_at.time*1000).format('YYYY-MM-DD HH:mm:ss') + '： 司机确认取货')
			}
			if(order.company_confirm_cargo_at.time){
				logs.push(moment(order.company_confirm_cargo_at.time*1000).format('YYYY-MM-DD HH:mm:ss') + '： 发货方确认司机已取货')
			}

			//运送

			if(order.logs && order.logs.length>0){
				var addresslog = order.logs
				for(var i=0;i<addresslog.length;i++)
				{
					logs.push(moment(addresslog[i].time*1000).format('YYYY-MM-DD HH:mm:ss') + '： 到达' + addresslog[i].address)
				}
			}
			//收货
			if(order.driver_confirm_deliver_at.time){
				logs.push(moment(order.driver_confirm_deliver_at.time*1000).format('YYYY-MM-DD HH:mm:ss') + '： 司机确认交货')
			}
			//投诉
			if(order.tousu_to_driver.time){
				logs.push(moment(order.tousu_to_driver.time*1000).format('YYYY-MM-DD HH:mm:ss') + '： 收货方发起投诉')
				var tousutime = Dateformat(new Date(order.tousu_to_driver.time * 1000), 'yyyy/mm/dd HH:MM')
				order.tousutime = tousutime
			}

			//投诉处理完成
			if(order.plat_handle_tousu.time){
				logs.push(moment(order.plat_handle_tousu.time*1000).format('YYYY-MM-DD HH:mm:ss') + '： 投诉处理完成')
				var handletime = Dateformat(new Date(order.plat_handle_tousu.time * 1000), 'yyyy/mm/dd HH:MM')
				order.handletime = handletime
			}

			if(order.company_confirm_deliver_at.time){
				logs.push(moment(order.company_confirm_deliver_at.time*1000).format('YYYY-MM-DD HH:mm:ss') + '： 收货方确认收货')
			}
			//评价
			if(order.comment_to_driver.time){
				logs.push(moment(order.comment_to_driver.time*1000).format('YYYY-MM-DD HH:mm:ss') + '： 收货方已评价 ')
			}
			if(order.comment_to_company.time){
				logs.push(moment(order.comment_to_company.time*1000).format('YYYY-MM-DD HH:mm:ss') + '： 司机已评价')
			}

			order.log = logs
			res.render('service_detail',{
				username:req.session.passport.user,
				order:order
			})
		})

}

serviceController.search=function (req,res) {
	var page = req.query.page || 1
	var page_size = req.query.page_size || req.app.get('config').page_size
	var query = req.body.query
	console.log(query)
	var pattern = query
	var reg = {$regex: pattern, $options:"i"}
	var orders =[]
	Company.find({
		$or:[
			{name:reg},
			{contact_name:reg}
		]
	}).then(companys=>{
		if(companys && companys.length>0){
			var companys_arr = new Array()
			companys.forEach(company=>{
				companys_arr.push(company._id)
			})
			console.log(companys_arr)
			Account.find({company:{$in:companys_arr}}).then(accounts=>{
				if(accounts && accounts.length>0){
					var account_users = new Array()
					accounts.forEach(account=>{
						account_users.push(account._id)
					})

					//orders
					console.log(account_users)
					if(account_users.length>0){
						Order.count({account:{$in:account_users}}, function(err, count) {
							Order.find({
								account:{$in:account_users},
								state:5
							}).sort({created_at:-1}).populate({
								path: 'driver',
								model: 'Driver',
								populate: {
									path: 'user',
									model: 'User'
								}
							}).populate({
								path: 'account',
								model: 'Account',
								populate: {
									path: 'company',
									model: 'Company'
								}
							}).then(orders=>{
								console.log(orders)
								orders.forEach(order=>{
									order.created_time = moment(order.created_at).format('YYYY-MM-DD HH:mm:ss')
									order.publish_time = Dateformat(new Date(order.publish_at*1000),'yyyy-mm-dd hh:MM')
								})
								res.render('service', {
									orders: orders,
									username:req.session.passport.user

								});
							})
						})
					}
					else
					{
						res.render('service', {
							username:req.session.passport.user,
							orders: orders
						});
					}
				}
				else{
					res.render('service', {
						username:req.session.passport.user,
						orders: orders
					});
				}
			})
		}
		else{
			res.render('service', {
				username:req.session.passport.user,
				orders: orders
			});
		}
	})
}

module.exports = serviceController;
