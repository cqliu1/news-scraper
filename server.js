// DEPENDENCIES
var express = require("express");
var exphbs = require("express-handlebars");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var cheerio = require("cheerio");
var request = require("request");

// Models
var Article = require("./models/Article");
var Comment = require("./models/Comment");

// Set mongoose to leverage built in JavaScript ES6 Promises
mongoose.Promise = Promise;

// establish connection to models

// Initialize Express
var app = express();
var port = process.env.PORT || 3000;

// Configure app with morgan and body parser
app.use(bodyParser.urlencoded({
  extended: false
}));

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Static file support with public folder
app.use(express.static("public"));

// Database configuration for mongoose
// db: newsscraper
mongoose.connect("mongodb://localhost/newsscraper");
// Hook mongoose connection to db
var db = mongoose.connection;

// Log any mongoose errors
db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

// Log a success message when we connect to our mongoDB collection with no issues
db.once("open", function() {
  console.log("Mongoose connection successful.");
});

// Routes
// ======

app.get("/", function(req, res) {



  // TODO: Finish the route so it grabs all of the articles
  Article.find()
    .exec( function(err, articles) {
      res.render("index",{
        articles
      });
    });
});

// A GET request to scrape the echojs website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with request
  request("https://www.nytimes.com/", function(error, response, html) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(html);
    // Now, we grab every h2 within an article tag, and do the following:
    $("article.theme-summary").each(function(i, element) {

      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.headline = $(this).children("h2").children("a").text();
      result.summary = $(this).children("h2").children("p.summary").text();
      result.url = $(this).children("h2").children("a").attr("href");

      // Using our Article model, create a new entry
      // This effectively passes the result object to the entry (and the title and link)
      var entry = new Article(result);
      console.log(entry);

      // // Now, save that entry to the db
      // entry.save(function(err, doc) {
      //   // Log any errors
      //   if (err) {
      //     console.log(err);
      //   }
      //   // Or log the doc
      //   else {
      //     console.log(doc);
      //   }
      // });

    });
  });
  // Tell the browser that we finished scraping the text
  // res.send("Scrape Complete");
});

// This will get the articles we scraped from the mongoDB
app.get("/articles", function(req, res) {


  // TODO: Finish the route so it grabs all of the articles
  Article.find()
    .exec( function(err, articles) {
      res.send(articles);
    });

});

// This will grab an article by it's ObjectId
app.get("/articles/:id", function(req, res) {


  // TODO
  // ====

  // Finish the route so it finds one article using the req.params.id,

  // and run the populate method with "note",

  // then responds with the article with the note included
  Article.findOne({_id: mongoose.mongo.ObjectId(req.params.id)})
    .populate("note")
    .exec( function(err, article) {
      if(err) {
        res.send(err);
      } else {
        res.send(article);
      }
    });


});

// Create a new note or replace an existing note
app.post("/articles/:id", function(req, res) {


  // TODO
  // ====

  // save the new note that gets posted to the Notes collection

  // then find an article from the req.params.id

  // and update it's "note" property with the _id of the new note
  let newNote = new Note(req.body);

  newNote.save( function(err, note) {
    if(err){ 
      res.send(err);
    } else {
      Article.findOneAndUpdate({_id: mongoose.mongo.ObjectId(req.params.id)}, { $set: { note: note._id } }, function(err, article) {
        if(err){ 
          res.send(err);
        } else {
          res.send(article)
        }
      });
    }
  });
});


// Listen on port 3000
app.listen(3000, function() {
  console.log("App running on port 3000!");
});
