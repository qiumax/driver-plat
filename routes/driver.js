var express = require('express');
var router = express.Router();
var driverController = require("../controllers/DriverController.js");

// var mutipart= require('connect-multiparty');
// var mutipartMiddeware = mutipart();

router.get('/all', driverController.all);

router.get('/to_chushen', driverController.to_chushen);

router.get('/to_mianshen', driverController.to_mianshen);

router.get('/edit', driverController.edit);

router.post('/driver_update', driverController.driver_update);

router.get('/approve', driverController.approve);

router.post('/approve_update', driverController.approve_update);

router.post('/search', driverController.search);

module.exports = router;
