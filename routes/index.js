var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET chat page. */
router.get('/chat', function(req, res, next) {
  // Read library files
  const bootstrapCSS = fs.readFileSync(path.join(__dirname, '../node_modules/bootstrap/dist/css/bootstrap.min.css'), 'utf8');
  const toastrCSS = fs.readFileSync(path.join(__dirname, '../node_modules/toastr/build/toastr.min.css'), 'utf8');
  const jquery = fs.readFileSync(path.join(__dirname, '../node_modules/jquery/dist/jquery.min.js'), 'utf8');
  const bootstrapJS = fs.readFileSync(path.join(__dirname, '../node_modules/bootstrap/dist/js/bootstrap.bundle.min.js'), 'utf8');
  const angular = fs.readFileSync(path.join(__dirname, '../node_modules/angular/angular.min.js'), 'utf8');
  const toastrJS = fs.readFileSync(path.join(__dirname, '../node_modules/toastr/build/toastr.min.js'), 'utf8');
  
  res.render('chat', { 
    title: 'EchoWave Chat',
    bootstrapCSS: bootstrapCSS,
    toastrCSS: toastrCSS,
    jquery: jquery,
    bootstrapJS: bootstrapJS,
    angular: angular,
    toastrJS: toastrJS
  });
});

module.exports = router;
