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
mongoose.connect("mongodb://heroku_107ljph3:ao3411blmkml5ubn6go9chj0t6@ds149603.mlab.com:49603/heroku_107ljph3");
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
  request("http://www.npr.org/sections/news/", function(error, response, html) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(html);
    // Now, we grab every h2 within an article tag, and do the following:
    $("div.item-info").each(function(i, element) {
      console.log(element);
      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.headline = $(this).children("h2").children("a").text();
      result.summary = $(this).children("p.teaser").text();
      result.url = $(this).children("h2").children("a").attr("href");

      // Using our Article model, create a new entry
      // This effectively passes the result object to the entry (and the title and link)
      var entry = new Article(result);
      console.log(entry);

      // Now, save that entry to the db
      if(!(result.headline.length === 0 || result.url.length === 0)) {
        entry.save(function(err, doc) {
          // Log any errors
          if (err) {
            console.log(err);
          }
          // Or log the doc
          else {
            console.log("Saved:",doc);
          }
        });
      }
    });
  });
  // Tell the browser that we finished scraping the text
  res.send("Scrape Complete");
});

// This will grab an article by it's ObjectId
app.get("/article/:id", function(req, res) {

  Article.findOne({_id: mongoose.mongo.ObjectId(req.params.id)})
    .populate("comments")
    .exec( function(err, article) {
      if(err) {
        res.send(err);
      } else {
        console.log(article);
        res.render("article", {
          article
        });
      }
    });

});

// Create a new note or replace an existing note
app.post("/article/:id", function(req, res) {
  console.log("REQ BODY:", req.body);
  let newComment = new Comment(req.body);

  newComment.save( function(err, comment) {
    if(err){ 
      res.send(err);
    } else {
      Article.findOneAndUpdate({_id: mongoose.mongo.ObjectId(req.params.id)}, { $push: { comments: comment._id } }, function(err, article) {
        if(err){ 
          res.send(err);
        } else {
          res.redirect("/article/" + req.params.id);
        }
      });
    }
  });
});


// Listen on port 3000
app.listen(3000, function() {
  console.log("App running on port 3000!");
});
