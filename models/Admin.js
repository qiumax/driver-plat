var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var AdminSchema = new Schema({
	username: String,
	password: String
}, {timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}});

//plugin可接受option参数
AdminSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('Admin', AdminSchema, 'admins');