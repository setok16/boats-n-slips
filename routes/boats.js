var express = require('express');
var router = express.Router();
var nestRouter = express.Router({mergeParams: true});
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;

/* Date Variable */
var dateObj = new Date();
var year = dateObj.getUTCFullYear();
var month = dateObj.getUTCMonth()+1;
var day = dateObj.getUTCDate();
var currentDate = year + "/" + month + "/" + day;

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
	if (!req.body.name || !req.body.type || !req.body.length) {
		res.status(403).send('Error: name, type, and length fields required');
		return;
	}
	MongoClient.connect(process.env.MONGO_URL, {}, function(err, db) {
		var collection = db.collection('boats');
		var data = {
			name: req.body.name,
			type: req.body.type,
			length: req.body.length,
			at_sea: true,
			slip_number: null
		};

		console.log(data);
		collection.insert(data, {w:1}, function(err, result) {
			if (err) { return console.dir(err) };
			res.status(200).send(data);
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
		var data = {}
		if (req.body.name) {
			data.name = req.body.name;
		}
		if (req.body.type) {
			data.type = req.body.type;
		}
		if (req.body.length) {
			data.length = req.body.length;
		}
		if (req.body.at_sea) {
			data.at_sea= req.body.at_sea;
		}
		console.log(data);
		if (data.at_sea) {
			data.slip_number = null
			slipCollection.update({current_boat:req.params.boatId}, {$set:{current_boat:"",arrival_date:""},$push:{departure_history:{departure_date:currentDate,departed_boat:req.params.boatId}}}, {w:1}, function(err, result) {
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

/* PUT /boats/:boatId/arrive API */
router.put('/arrive/:boatId', function(req, res, next) {
	
	// Checking for invalid id number
	if (req.params.boatId.length != 24) {
		res.status(403).send('Error: Invalid boatId number');
		return;
	}

	MongoClient.connect(process.env.MONGO_URL, {}, function(err, db) {
		var collection = db.collection('boats');
		var slipCollection = db.collection('slips');
		collection.find({_id:ObjectId(req.params.boatId)}).toArray(function(err, items) {
			if (items.length == 0) {
				res.status(404).send('Error: This boat does not exist');
				return;
			} else if (!items[0].at_sea) {
				res.status(403).send('Error: This boat is currently not at sea');
				return;
			}
			slipCollection.find({current_boat:""}).toArray(function(err, items) {
				if(items.length == 0) {
					res.status(403).send('Error: No vacant slips.');
					return;
				}
				var slipNumber = items[0].number;
				var slipId = items[0]._id;
				slipCollection.update({_id:ObjectId(slipId)}, {$set:{current_boat:req.params.boatId, arrival_date:currentDate}}, {w:1}, function(err, result) {
					collection.update({_id:ObjectId(req.params.boatId)}, {$set:{at_sea:false, slip_number:slipNumber}}, {w:1}, function(err, result) {
						res.status(200).send('Success arrival');
					});
				});
			});
		});
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
				slipCollection.update({current_boat:req.params.boatId}, {$set:{current_boat:"", arrival_date:""},$push:{departure_history:{departure_date:currentDate, departed_boat:req.params.boatId}}}, {w:1}, function(err, result) {
					if (err) {return console.dir(err)}
					res.status(200).send('DELETE Success');
				});
			}
		});
	});
});

module.exports = router;
