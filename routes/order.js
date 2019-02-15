var express = require('express');
var router = express.Router();
var orderController = require("../controllers/OrderController.js");

router.get('/all', orderController.all);

router.get('/ing', orderController.ing);

router.get('/finish', orderController.finish);

router.get('/detail', orderController.detail);

router.post('/search', orderController.search);

module.exports = router;
