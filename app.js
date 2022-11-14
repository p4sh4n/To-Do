//jshint esversion:6

//req modules
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash')

const app = express();

//ejs
app.set('view engine', 'ejs');

//express & bodyParser
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//mongoose connect
mongoose.connect('mongodb+srv://admin-pasha:0708bmniaptc@cluster0.du2wiss.mongodb.net/todolistDB', {useNewUrlParser: true});

//mongo schemas & models

const itemSchema = new mongoose.Schema({
  name: String
})

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema]
})

const Item = mongoose.model('Item', itemSchema);
const List = mongoose.model('List', listSchema);

const item1 = new Item({
  name: 'Welcome to todo!'
})

const item2 = new Item({
  name: 'Hit + to add an item'
})

const item3 = new Item({
  name: '<--- hit this to delete an item'
})

const defaultItems = [item1, item2, item3]

//node get routes
app.get("/", function(req, res) {
  if(Item.find().length === 0){
    Item.insertMany(defaultItems)
  }

  Item.find((err, results) =>{
    if (err) {
      console.log(err);
    }
    else{
      res.render("list", {listTitle: 'Today', newListItems: results});
    }
  })
});

app.get("/about", function(req, res){
  res.render("about");
});

app.get('/:listTitle', (req, res) => {
  const listName = _.capitalize(req.params.listTitle)

  List.findOne({name: listName}, (err, result)=>{
    if(err){
      console.log(err);
    }
    else if (!result){
      const newList = new List({
        name: listName,
        items: defaultItems
      })  
      newList.save()
      res.redirect('/' + newList.name)
    }
    else{
      res.render('list', {listTitle: result.name, newListItems: result.items})
    }
  })
})

//node post routes
app.post("/", function(req, res){
  const itemName = req.body.newItem
  const listName = req.body.list

  const newItem = new Item({
    name: itemName
  })

  if(listName === 'Today'){
    console.log('You are in the default todo!');
    newItem.save();
    res.redirect('/');
  }
  else{
    console.log('You are in ' + listName + ' todo!');
    List.findOne({name: listName}, (err, foundList)=>{
      if(err){
        console.log(err);
      }
      else{
        foundList.items.push(newItem)
        foundList.save()
        res.redirect('/' + listName) 
      }
    })
  }
});

app.post('/delete', (req, res)=>{
  const listName = req.body.listName
  const itemID = req.body.checkbox

  if(listName === 'Today'){
    Item.findByIdAndRemove(itemID, (err)=>{
      if(err){
        console.log(err);
      }
      else{
        console.log('Successfully deleted an item!');
        res.redirect('/')
      }
    })
  }
  else{
    List.findOneAndUpdate(
      {name: listName}, 
      {$pull: {items: {_id: itemID}}},
      (err, result)=>{
        if(err){
          console.log(err)
        }
        else{
          res.redirect('/' + listName)
        }
      }
    )
  }
})

//server start

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started");
});