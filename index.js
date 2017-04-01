const express = require('express');
const request = require('request');
const app = express();

const CLIENT_KEYS = require('./secret.js');

app.get('/*', (req, res) => {
  let offset = 0;
  if (req.query.offset != null && parseInt(req.query.offset)) {
    offset = parseInt(req.query.offset);
  }
  console.log(offset);
  let options = {
    url: 'https://api.imgur.com/3/gallery/search/time/' + offset + '?q=' + req.path.slice(1),
    headers: {
      'Authorization': 'Client-ID ' + CLIENT_KEYS.CLIENT_ID, 
    }
  }
  request(options, function (error, response, body) {
    res.send(body);
  });
});

app.listen(8080, () => {
  console.log('app is listening on port 8080');
});