var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var NeedSchema = new Schema({
	truck: {
		type: Schema.ObjectId,
		ref: 'Truck'
	},
	com_user: {
		type: Schema.ObjectId,
		ref: 'ComUser'
	},
	account: {
		type: Schema.ObjectId,
		ref: 'Account'
	},
	need_schedule: {
		type: Schema.ObjectId,
		ref: 'NeedSchedule'
	},
	from: {
		city: String,
		address: String,
		note: String,
		name: String,
		phone: String,
		location: {
			type: { type: String },
			coordinates: []
		}
	},
	to: {
		city: String,
		address: String,
		note: String,
		name: String,
		phone: String,
		location: {
			type: { type: String },
			coordinates: []
		}
	},
	time: Number,
	cargo: String,
	price_type: String,
	mass: Number,
	distance: Number,
	volume: Number,
	price: Number,
	size:String,
	closed: Boolean
}, {timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}});

module.exports = mongoose.model('Need', NeedSchema, 'needs');