var express = require('express');
var router = express.Router();
var truckController = require("../controllers/TruckController.js");

var mutipart= require('connect-multiparty');
var mutipartMiddeware = mutipart();

router.get('/all', truckController.all);

router.post('/search', truckController.search);

router.get('/add', function (req,res) {
	res.render('truck_add');
});

router.get('/edit', truckController.edit);

router.post('/add', mutipartMiddeware, truckController.add);

router.post('/update', mutipartMiddeware, truckController.update);

router.post('/delete', truckController.delete);

module.exports = router;