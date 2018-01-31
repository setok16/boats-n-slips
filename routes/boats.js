var express = require('express');
var router = express.Router();
var nestRouter = express.Router({mergeParams: true});
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;

/* GET /boats API */
router.get('/', function(req, res, next) {
	MongoClient.connect(process.env.MONGO_URL, {}, function(err, db) {
		var collection = db.collection('boats');
		collection.find().toArray(function(err, items) {
			res.status(200).send(items);
		});
	});
});

/* Get /boats/:boatId API */
router.get('/:boatId', function(req, res, next) {
	
	// Checking for invalid id number
	if (req.params.boatId.length != 24) {
		res.status(403).send('Error: Invalid boatId number');
		return;
	}

	MongoClient.connect(process.env.MONGO_URL, {}, function(err, db) {
		var collection = db.collection('boats');
		collection.find({_id:ObjectId(req.params.boatId)}).toArray(function(err, items) {
		if (items.length == 0) {
			res.status(404).send('Error: This boat does not exist');
			return;
		}
		res.status(200).send(items);
		});
	});
});

/* POST /boats API */
router.post('/', function(req, res, next) {
	MongoClient.connect(process.env.MONGO_URL, {}, function(err, db) {
		var collection = db.collection('boats');
		var data = req.body;
		data.at_sea = true;
		console.log(data);
		collection.insert(data, {w:1}, function(err, result) {
			if (err) { return console.dir(err) };
			res.status(200).send('POST Success');
		});
	});
});

/* PUT /boats/:boatId API */
router.put('/:boatId', function(req, res, next) {
	
	// Checking for invalid id number
	if (req.params.boatId.length != 24) {
		res.status(403).send('Error: Invalid boatId number');
		return;
	}

	MongoClient.connect(process.env.MONGO_URL, {}, function(err, db) {
		var collection = db.collection('boats');
		var slipCollection = db.collection('slips');
		var data = req.body;
		console.log(data);
		if (data.at_sea) {
			var dateObj = new Date();
			var year = dateObj.getUTCFullYear();
			var month = dateObj.getUTCMonth()+1;
			var day = dateObj.getUTCDate();
			var departureDate = year + "/" + month + "/" + day;
			slipCollection.update({current_boat:req.params.boatId}, {$set:{current_boat:"",arrival_date:""},$push:{departure_history:{departure_date:departureDate,departed_boat:req.params.boatId}}}, {w:1}, function(err, result) {
				if (err) {console.log(err)}
				if (result.result.n == 0) {
					res.status(403).send('Error: Boat is already at sea');
					return;
				}
				collection.update({_id:ObjectId(req.params.boatId)}, {$set:data}, {w:1}, function(err, result) {
					if (result.result.n == 0) {
						res.status(404).send('Error: Boat not found');
						return;
					}
					if (err) { return console.dir(err) };
					res.status(200).send('PUT Success');
				});
			});
		} else {
			collection.update({_id:ObjectId(req.params.boatId)}, {$set:data}, {w:1}, function(err, result) {
				if (err) { return console.dir(err) };
				res.status(200).send('PUT Success');
			});
		}
	});
});

/* DELETE /boats/:boatId API */
router.delete('/:boatId', function(req, res, next) {
	
	// Checking for invalid id number
	if (req.params.boatId.length != 24) {
		res.status(403).send('Error: Invalid boatId number');
		return;
	}

	MongoClient.connect(process.env.MONGO_URL, {}, function(err, db) {
		var collection = db.collection('boats');
		var slipCollection = db.collection('slips');
		collection.remove({_id:ObjectId(req.params.boatId)}, {w:1}, function(err, result) {
			console.log(result.result.n);
			if (result.result.n == 0) { // If boat doesn't exist, throw 404
				res.status(404).send('Error: Boat not found');
			} else {
				slipCollection.update({current_boat:req.params.boatId}, {$set:{current_boat:"", arrival_date:""}}, {w:1}, function(err, result) {
					if (err) {return console.dir(err)}
					res.status(200).send('DELETE Success');
				});
			}
		});
	});
});

module.exports = router;
