var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var MongoClient= require('mongodb').MongoClient;
var dotenv = require('dotenv').config();

var index = require('./routes/index');
var users = require('./routes/users');
var boats = require('./routes/boats');
var slips = require('./routes/slips');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Connect to mongodb
MongoClient.connect(process.env.MONGO_URL, {
//	uri_decode_auth: true
	}, function(err, db) {
		if(err) { return console.dir(err); } 
		
		var collection = db.collection('test');
		/* // Inserting Examples
		var doc1 = {'hello':'doc1'};
		var doc2 = {'hello':'doc2'};
		var lotsOfDocs = [{'hello':'doc3'}, {'hello':'doc4'}];
		collection.insert(doc1);
		collection.insert(doc2, {w:1}, function(err, result) {});
		collection.insert(lotsOfDocs, {w:1}, function(err, result) {});
		*/

		/*// Updating examples
			// synchornous
		var doc = {mykey:1, fieldtoupdate:1};
		collection.insert(doc);
		collection.update({mykey:1}, {$set:{fieldtoupdate:2}})
			//async
		var docc = {mykey:2, docs:[{doc1:1}]};
		collection.insert(docc, {w:1}, function(err, result) {
			// pushing element to array
			collection.update({mykey:2}, {$push:{docs:{doc2:1}}}, {w:1}, function(err, result) {});
		});
		*/

		/*// Remove examples
		var docs = [{mykey:1}, {mykey:2}, {mykey:3}];
		collection.insert(docs, {w:1}, function(err, result) {
			collection.remove({mykey:1});
			collection.remove({mykey:2}, {w:1}, function(err, result) {});
		});
		*/

	});

app.use('/', index);
app.use('/users', users);
app.use('/boats', boats);
app.use('/slips', slips);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
