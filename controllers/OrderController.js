var mongoose = require("mongoose");
var Order = require("../models/Order");
var Account = require("../models/Account");
var Company = require("../models/Company");
var Dateformat = require("dateformat");
var moment = require("moment");

var orderController = {};

orderController.all = function(req, res) {
	var page = req.query.page || 1
	var page_size = req.query.page_size || req.app.get('config').page_size

	Order.countDocuments({}, function(err, count) {
		if (err) throw err
		console.log(count)
		Order.find({}).sort({created_at:-1}).skip((page-1)*page_size).limit(page_size).populate({
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
			res.render('order', {
				orders: orders,
				username:req.session.passport.user,
				page: page,
				page_total: count%page_size==0? count/page_size:(Math.floor(count/page_size)+1)
			})
		})
	})
};



orderController.finish = function(req, res) {
	var page = req.query.page || 1
	var page_size = req.query.page_size || req.app.get('config').page_size

	Order.countDocuments({
		$or:[
			{state:6},
			{state:8}
		]
	}, function(err, count) {
		if (err) throw err
		console.log(count)
		Order.find({
			$or:[
				{state:6},
				{state:8}
			]
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
			res.render('order', {
				orders: orders,
				username:req.session.passport.user,
				page: page,
				page_total: count%page_size==0? count/page_size:(Math.floor(count/page_size)+1)
			})
		})
	})
};

orderController.detail = function (req,res) {
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
				logs.push(moment(order.created_at).format('YYYY-MM-DD HH:mm:ss') + '：  提交运单')
			}

			//接单
			if(order.publish_at)
			{
				logs.push(Dateformat(new Date(order.publish_at*1000), 'yyyy-mm-dd HH:MM:ss') +'：  司机接单')
			}
			if(order.driver_confirm_cargo_at.time){
				logs.push(moment(order.driver_confirm_cargo_at.time*1000).format('YYYY-MM-DD HH:mm:ss') + '：  司机确认取货')
			}
			if(order.company_confirm_cargo_at.time){
				logs.push(moment(order.company_confirm_cargo_at.time*1000).format('YYYY-MM-DD HH:mm:ss') + '：  发货方确认司机已取货')
			}

			//运送

			if(order.logs && order.logs.length>0){
				var addresslog = order.logs
				for(var i=0;i<addresslog.length;i++)
				{
					logs.push(moment(addresslog[i].time*1000).format('YYYY-MM-DD HH:mm:ss') + '：  到达' + addresslog[i].address)
				}
			}
			//收货
			if(order.driver_confirm_deliver_at.time){
				logs.push(moment(order.driver_confirm_deliver_at.time*1000).format('YYYY-MM-DD HH:mm:ss') + '：  司机确认交货')
			}
			//投诉
			if(order.tousu_to_driver.time){
				order.tousutime = moment(order.tousu_to_driver.time*1000).format('YYYY-MM-DD HH:mm:ss')
				logs.push(moment(order.tousu_to_driver.time*1000).format('YYYY-MM-DD HH:mm:ss') + '：  收货方发起投诉')
			}

			//投诉处理完成
			if(order.plat_handle_tousu.time){
				order.handletime = moment(order.plat_handle_tousu.time*1000).format('YYYY-MM-DD HH:mm:ss')
				logs.push(moment(order.plat_handle_tousu.time*1000).format('YYYY-MM-DD HH:mm:ss') + '：  投诉处理完成')
			}

			if(order.company_confirm_deliver_at.time){
				logs.push(moment(order.company_confirm_deliver_at.time*1000).format('YYYY-MM-DD HH:mm:ss') + '：  收货方确认收货')
			}
			//评价
			if(order.comment_to_driver.time){
				logs.push(moment(order.comment_to_driver.time*1000).format('YYYY-MM-DD HH:mm:ss') + '：  收货方已评价 ')
			}
			if(order.comment_to_company.time){
				logs.push(moment(order.comment_to_company.time*1000).format('YYYY-MM-DD HH:mm:ss') + '：  司机已评价')
			}

			order.log = logs
			res.render('order_detail',{
				username:req.session.passport.user,
				order:order
			})
		})

}

orderController.search=function (req,res) {
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
							Order.find({account:{$in:account_users}}).sort({created_at:-1}).populate({
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
								res.render('order', {
									orders: orders,
									username:req.session.passport.user

								});
							})
						})
					}
					else
					{
						res.render('order', {
							username:req.session.passport.user,
							orders: orders
						});
					}
				}
				else{
					res.render('order', {
						username:req.session.passport.user,
						orders: orders
					});
				}
			})
		}
		else{
			res.render('order', {
				username:req.session.passport.user,
				orders: orders
			});
		}
	})
}

module.exports = orderController;
