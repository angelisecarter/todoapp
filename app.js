//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// Connect to DB and Create Schema and Model and load initial items
mongoose.connect("mongodb://127.0.0.1:27017/todolistDB", {useNewUrlParser: true});

const itemSchema = new mongoose.Schema ({
  name: {type: String, required: [true, "You forgot to enter a name."]}
});

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item ({ name: "Attend the Perseid Shooting Star Party"});
const item2 = new Item ({ name: "Finish Chapter 35 of Web Dev Course"});
const item3 = new Item ({ name: "Wash School Clothes"});

// Create schema and model for custom Lists
const listSchema = {
  name: String,
  items: [itemSchema]
};
const List = mongoose.model("List", listSchema);

// End of DB Setup

app.get("/", function(req, res) {
  Item.find({})
  .then(function(result){
    if (result.length === 0) {
      Item.insertMany ([ 
        item1, item2, item3
      ]).then(function() {
        console.log("Succesfully saved all the items to todolistDB");
      }).catch(function(err) {
        console.log(err);
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: result});
    }
    
  })
  .catch(function(err){
    console.log(err);
  });
});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName})
  .then((foundList) => {
    if (foundList) {
      console.log("List Found :", foundList);
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    } else {
      console.log("No list found.  Creating new List.");
      const list = new List({
        name: customListName,
        items: [item1, item2, item3]
      });
      list.save()
      .then(() => {
        res.redirect("/" + customListName);
      });
    }
  })
  .catch((err) => {
    console.log(err);
  })
});

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const userEntry = new Item ({ name: itemName});

  if (listName === "Today") {
    userEntry.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName})
    .then((foundList) => {
      foundList.items.push(userEntry);
      foundList.save()
      .then(() => {
        res.redirect("/" + listName);
      });
    })
    .catch((err) => {
      console.log("Error saving list item to Custom List")
    });
  }
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkedbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId)
    .then(() => {
      console.log("Succesfully deleted checked item from todolistDB");
      res.redirect("/")
    })
    .catch((err) => {
      console.log(err);
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}})
    .then((foundList) => {
      console.log("Succesfully deleted checked item from Custom List: " + foundList.name);
      res.redirect("/" + listName);
    })
    .catch((err) => {
      console.log(err);
    });
  }
});



app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
