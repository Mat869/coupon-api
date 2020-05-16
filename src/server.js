const express = require('express');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const app = express();
const cors = require('cors');
const port = 3000;

app.use(cors());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

let db;
const client = new MongoClient('mongodb://localhost:27017', { useUnifiedTopology: true });
client.connect((err) => {
	if(err) {
		console.error(err);
		return;
    }
    db = client.db('couponAPI');
    console.log('Successful connection to DB');
});

function genCode(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

app.put('/coupon', (req, res) => {

    let couponCode = genCode(10);

    let coupon = {
        date: new Date(),
        code : couponCode,
        isRedeem : false
    }

    db.collection('coupons').insertOne(coupon, (err, coupon) => {
        if(err) {
            console.log(err);
            res.sendStatus(500);
            return;
        }
        res.status(201).json(coupon.ops[0]);
    });

});

app.get('/coupon', (req, res) => {
    db.collection('coupons').find().toArray((err, coupons) => {
        if(err) {
            console.log(err);
            res.sendStatus(500);
            return;
        }
        res.json(coupons);
    });
});

app.get('/coupon/:id', (req, res) => {
    db.collection('coupons').findOne({
        _id: ObjectId(req.params.id)
    }, (err, coupon) => {
        if(err) {
            console.log(err);
            res.sendStatus(500);
            return;
        }
        res.status(200).json(coupon);
    });
});

app.get('/coupon/search/:code', (req, res) => {
    db.collection('coupons').findOne({
        code: req.params.code
    }, (err, coupon) => {
        if(err) {
            console.log(err);
            res.sendStatus(500);
            return;
        }
        if(!coupon) {
			res.sendStatus(404);
			return;
		}
        res.status(200).json(coupon);
    });
});

app.post('/coupon/:id/redeem', (req, res) => {
    const coupondId = ObjectId(req.params.id);
    db.collection('coupons').findOne({
        _id: coupondId
    }, (err, coupon) => {
        if(err) {
            console.log(err);
            res.sendStatus(500);
            return;
        }
        if(!coupon) {
			res.sendStatus(404);
			return;
        }
        if(coupon.isRedeem){
            res.status(400).json({'error':'already used'});
            return;
        }
        db.collection('coupons').updateOne(
            {_id: coupondId},
            {$set: {isRedeem: true}},
            (err) => {
				if(err) {
					console.log(err);
					res.sendStatus(500);
					return;
				}
				res.status(200);
            }
        );
    });
});

app.delete('/coupon/:id', (req, res) => {
    db.collection('coupons').findOneAndDelete(
		{
			_id: ObjectId(req.params.id)
		}, (err, report) => {
			if(report.value === null) {
				res.sendStatus(404);
				return;
			}
			res.sendStatus(204);
		}
	);
});


app.listen(port, () => console.log(`Server listening on port ${port}!`));

