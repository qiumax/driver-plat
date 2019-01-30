var express = require('express');
var router = express.Router();
var serviceController = require("../controllers/ServiceController.js");

var mutipart= require('connect-multiparty');
var mutipartMiddeware = mutipart();

router.get('/handle', serviceController.handle);

router.get('/finish', serviceController.finish);

router.get('/detail', serviceController.detail);

router.post('/search', serviceController.search);

router.post('/update', mutipartMiddeware,serviceController.update);

module.exports = router;
