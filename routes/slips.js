var express = require('express');
var router = express.Router();
var nestRouter = express.Router({mergeParams: true});
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;

/* GET /slips API */
router.get('/', function(req, res, next) {
	MongoClient.connect(process.env.MONGO_URL, {}, function(err, db) {
		var collection = db.collection('slips');
		collection.find().toArray(function(err, items) {
			res.status(200).send(items);
		});
	});
});

/* Get /slips/:slipId API */
router.get('/:slipId', function(req, res, next) {
	
	// Check if slipId is valid
	if (req.params.slipId.length != 24) {
		res.status(403).send('Error: Invalid slip id number');
		return;
	}

	MongoClient.connect(process.env.MONGO_URL, {}, function(err, db) {
		var collection = db.collection('slips');
		collection.find({_id:ObjectId(req.params.slipId)}).toArray(function(err, items) {
		if (items.length == 0) {
			res.status(403).send('Error: This slip does not exist');
			return;
		}
		res.status(200).send(items);
		});
	});
});

/* POST /slips API */
router.post('/', function(req, res, next) {
	MongoClient.connect(process.env.MONGO_URL, {}, function(err, db) {
		var collection = db.collection('slips');


		var data = req.body;
		data.current_boat = "";
		data.arrival_date = "";
		data.departure_history = [];
		console.log(data);
		collection.insert(data, {w:1}, function(err, result) {
			if (err) { return console.dir(err) };
			res.status(200).send('POST Success');
		});
	});
});

/* PUT /slips/:slipId API */
router.put('/:slipId', function(req, res, next) {

	// Check if slipId is valid
	if (req.params.slipId.length != 24) {
		res.status(403).send('Invalid slip id number');
		return;
	}

	MongoClient.connect(process.env.MONGO_URL, {}, function(err, db) {
		var collection = db.collection('slips');
		var boatCollection = db.collection('boats');
		var data = req.body;
		console.log(data);
		if (data.current_boat) { // If a ship is arriving

			collection.find({_id:ObjectId(req.params.slipId)}).toArray(function(err, items) {
				if (items.length == 0) {
					res.status(403).send('Error: This slip does not exist');
					return;
				}
				if (items[0].current_boat) { // If the slip is preoccupied
					res.status(403).send('Forbidden: This slip is preoccupied');
				} else {

					boatCollection.find({_id:ObjectId(data.current_boat)}).toArray(function(err, items) {
						if (JSON.stringify(items[0])) { // If boat exists in boats collection
							//console.log("Items: " + JSON.stringify(items));
							var dateObj = new Date();
							var year = dateObj.getUTCFullYear();
							var month = dateObj.getUTCMonth()+1;
							var day = dateObj.getUTCDate();
							data.arrival_date = year + "/" + month + "/" + day;
							boatCollection.update({_id:ObjectId(data.current_boat)}, {$set:{at_sea: false}}, {w:1}, function (err, result) { // Updating at_sea
								collection.update({_id:ObjectId(req.params.slipId)}, {$set:data}, {w:1}, function(err, result) {
									res.status(200).send('PUT Success');
								});
							});
						} else {
								res.status(404).send('Error: Boat does not exist');
						}
					});
				}
			});

		} else {
			collection.update({_id:ObjectId(req.params.slipId)}, {$set:data}, {w:1}, function(err, result) {
				if (err) { return console.dir(err) };
				res.status(200).send('PUT Success');
			});
		}
	});
});

/* DELETE /slips/:slipId API */
router.delete('/:slipId', function(req, res, next) {
	
	// Checking for invalid id number
	if (req.params.slipId.length != 24) {
		res.status(403).send('Error: Invalid slipId number');
		return;
	}

	MongoClient.connect(process.env.MONGO_URL, {}, function(err, db) {
		var collection = db.collection('slips');
		var boatCollection = db.collection('boats');
		collection.find({_id:ObjectId(req.params.slipId)}).toArray(function(err, items) {
			if (items.length == 0) {
					res.status(404).send('Error: Slip not found');
					return;
			}
			collection.remove({_id:ObjectId(req.params.slipId)}, {w:1}, function(err, result) {
				if (items[0].current_boat) {
					boatCollection.update({_id:ObjectId(items[0].current_boat)}, {$set:{at_sea:true}}, {w:1}, function(err, result) {
						if (err) {return console.dir(err)}
						res.status(200).send('DELETE Success');
					});
				} else {
					res.status(200).send('DELETE Success');
				}
			});
		});
	});
});


module.exports = router;
