var express = require('express');
var router = express.Router();
var needController = require("../controllers/NeedController.js");

router.get('/all', needController.all);
router.get('/detail', needController.detail);
router.post('/search', needController.search);
module.exports = router;
