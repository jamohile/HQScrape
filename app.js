var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var fetch = require('fetch');
var search = require('string-search');
//var ocr = require('ocr');

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.get('/', (req, res) => {
    res.render('query', {answer: undefined});
})
app.post('/', (req, res) => {
    var body = req.body;
    var question = body.question;
    var a1 = body.a1;
    var a2 = body.a2;
    var a3 = body.a3;

    var confidences = new Map;

    //Get results for each one.

    getAdjustedGoogleHits(question, a1, (num) => {
       confidence = num;
       confidences.set(1, confidence);
       if(confidences.size == 3){
           done();
       }
    });
    getAdjustedGoogleHits(question, a2, (num) => {
        confidence = num;
        confidences.set(2, confidence);
        if(confidences.size == 3){
            done();
        }
    });
    getAdjustedGoogleHits(question, a3, (num) => {
        confidence = num;
        confidences.set(3, confidence);
        if(confidences.size == 3){
            done();
        }
    });
    function done(){
        var confidencesArray = [...confidences.values()]
        var winningIndex = confidencesArray.indexOf(Math.max(... confidences.values()));
        var winningAnswer = [... confidences.keys()][winningIndex];
        res.render('query', {answer: winningAnswer.toString()});
    }
})
/*
Get google result number of results
 */

app.get('/', (req, res) => {
    getNumGoogleHits(req.query.q, (numHits) => {
        res.send(numHits)
    })
});

function getAdjustedGoogleHits(question, answer, hits){
    getNumGoogleHits(question + ' ' + answer, (numHits) => {
       var totalHits = numHits;
       getNumGoogleHits(answer, (numHits) => {
          var baselineAnswerHits = numHits;
          hits(totalHits / baselineAnswerHits);
       });
    });
}
function getNumGoogleHits(query, hits){
    fetch.fetchUrl('http://www.google.com/search?q=' + query, (error, meta, body) => {
        var content = body.toString();
        var search = 'id="resultStats">About ';
        var index = (content.search(search));
        var numberString = content.substr(index + search.length, 15);
        numberString = numberString.replace(/\D/g,'');
        hits(numberString);
    });
}

function ocrImage(imageName){

}
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
