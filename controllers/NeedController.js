var mongoose = require("mongoose");
var Need = require("../models/Need");
var Account = require("../models/Account");
var Company = require("../models/Company");
var Dateformat = require("dateformat");
var moment = require("moment");

var needController = {};

needController.all = function(req, res) {
	var page = req.query.page || 1
	var page_size = req.query.page_size || req.app.get('config').page_size

	Need.countDocuments({
		closed:false
	}, function(err, count) {
		if (err) throw err
		console.log(count)
		Need.find({closed:false}).sort({created_at:-1}).skip((page-1)*page_size).limit(page_size).populate({
			path: 'account',
			model: 'Account',
			populate: {
				path: 'company',
				model: 'Company'
			}
		}).then(needs=>{
			needs.forEach(need=>{
				need.created_time = moment(need.created_at).format('YYYY-MM-DD HH:mm:ss')
			})
			res.render('need', {
				needs: needs,
				username:req.session.passport.user,
				page: page,
				page_total: Math.floor(count/page_size)+1
			})
		})
	})
};


needController.detail = function (req,res) {
		var need_id = req.query.id
		console.log(need_id)
		Need.findById(need_id).populate({
			path: 'account',
			model: 'Account',
			populate: {
				path: 'company',
				model: 'Company'
			}
		}).then(need=>{

			var mtime = Dateformat(new Date(need.time * 1000), 'yyyy/mm/dd HH:MM')
			need.sendtime = mtime
			//logs
			var logs = new Array()

			res.render('need_detail',{
				username:req.session.passport.user,
				need:need
			})
		})

}


needController.search = function (req, res) {
		var page = req.query.page || 1
		var page_size = req.query.page_size || req.app.get('config').page_size
		var query = req.body.query
		console.log(query)
		var pattern = query
		var reg = {$regex: pattern, $options:"i"}
		var needs =[]
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
							Need.count({account:{$in:account_users}}, function(err, count) {
								Need.find({account:{$in:account_users}}).sort({created_at:-1}).skip((page-1)*page_size).limit(page_size).populate({
									path: 'account',
									model: 'Account',
									populate: {
										path: 'company',
										model: 'Company'
									}
								}).then(needs=>{
									console.log(needs)
									needs.forEach(need=>{
										need.created_time = moment(need.created_at).format('YYYY-MM-DD HH:mm:ss')
									})
									res.render('need', {
										needs: needs,
										username:req.session.passport.user,
										page: page,
										page_total: Math.floor(count/page_size)+1
									});
								})
							})
						}
						else
						{
							res.render('need', {
								username:req.session.passport.user,
								needs: needs
							});
						}
					}
					else{
						res.render('need', {
							username:req.session.passport.user,
							needs: needs
						});
					}
				})
			}
			else{
				res.render('need', {
					username:req.session.passport.user,
					needs: needs
				});
			}
		})
}

module.exports = needController;
