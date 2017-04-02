const express = require('express');
const request = require('request');
const mongodb = require('mongodb');

const app = express();

const MongoClient = mongodb.MongoClient;
const MongoUrl = process.env.MLAB_URI;

const CLIENT_ID = process.env.CLIENT_ID;

app.set('port', (process.env.PORT || 8080));

app.use(express.static(__dirname));

app.get('/favicon.ico', (req, res) => {
    res.send(204);
});

app.get('/recent', (req, res) => {
  MongoClient.connect(MongoUrl, (err, db) => {
    if (err) {
      console.log(err);
      res.send('problem accessing database');
    } else {
      const collection = db.collection('recent');
      collection.find().sort({timestamp: -1}).toArray((err, data) => {
        if (err) {
          console.log(err);
          res.send('problem retrieving records');
        } else {
          const sendArr = data.map(doc => {
            return {
              term: doc.term,
              time: (new Date(doc.timestamp)).toUTCString(),
            };
          });
          res.send(sendArr);
        }
        db.close();
      });
    }
  })
});

app.get('/*', (req, res) => {
  let term = req.path.slice(1);
  addSearch(term);
  let offset = 0;
  if (req.query.offset != null && parseInt(req.query.offset)) {
    offset = parseInt(req.query.offset);
  }
  let options = {
    url: 'https://api.imgur.com/3/gallery/search/time/' + offset + '?q=' + term,
    headers: {
      'Authorization': 'Client-ID ' + CLIENT_ID, 
    }
  }
  request(options, function (error, response, body) {
    const images = JSON.parse(body).data.map(resImg => {
      return {
        url: resImg.link,
        text: resImg.title,
      };
    });
    res.send(images);
  });
});

app.listen(app.get('port'), () => {
  console.log('app is listening on port 8080');
});

function addSearch(term) {
  MongoClient.connect(MongoUrl, (err, db) => {
    if (err) {
      console.log(err);
      return;
    }
    const collection = db.collection('recent');

    const d = new Date();

    const searchObj = {
      term: term,
      timestamp: d.getTime(),
    };

    collection.insert(searchObj, (err, insertRes) => {
      if (err) {
        console.log(err);
        db.close();
      } else {
        collection.stats((err, stats) => {
          if (err) {
            console.log(err);
            db.close();
          }
          if (stats.count > 10) {
            collection.findAndModify({}, [['timestamp', 1]], {}, {remove: true}, (err, doc) => {
              if (err) {
                console.log('problem removing oldest search');
              }
              db.close();
            });
          }
        });
      }
    });
  });
}