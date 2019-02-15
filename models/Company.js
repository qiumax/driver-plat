var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var CompanySchema = new Schema({
	userid: Number,
	username: String,
	// password: String,
	contact_name: String,
	contact_phone: String,
	name: String,
	address: String,
	province: String,
	city: String,
	license_number: String,
	license_image: String,
	price_dun: Number,
	price_fang: Number,
	price_peizai_notchao:Number,
	price_peizai_chao:Number,
	price_zhengche_notchao:Number,
	price_zhengche_chao:Number,
	state: Boolean,
	deleted: Boolean,
	need_change_pwd: Boolean
}, {timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}});

//plugin可接受option参数
CompanySchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('Company', CompanySchema, 'companys');