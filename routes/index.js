var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('index', { title: 'Express' });
	var context = {
		boat:'blah',
		slip:'3',
		date:'2017-03-19'
	};
  res.status(200).send(context);
});

module.exports = router;
