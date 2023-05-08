const express = require("express");

const bodyParser = require("body-parser");

const request = require("request");

const https = require("https");



const app =express();

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));


app.get("/", function(req, res){
    res.sendFile(__dirname + "/index.html");
})

app.get("/create.html", function(req, res){
    res.sendFile(__dirname + "/create.html");
})

app.get("/purchase.html", function(req, res){
    res.sendFile(__dirname + "/purchase.html");
})

app.get("/remove.html", function(req, res){
    res.sendFile(__dirname + "/remove.html");
})
  
app.get("/sell.html", function(req, res){
    res.sendFile(__dirname + "/sell.html");
})

app.get("/transfer.html", function(req, res){
    res.sendFile(__dirname + "/transfer.html");
})


app.post('/submit', (req, res) => {
    const buttonClicked = Object.keys(req.body)[0]; // get first key

    console.log(buttonClicked); // print out first key
    if (buttonClicked === 'goback') {
      // response to key value equals to 'goback'
      res.redirect("/");
    } 
    else{
        res.redirect(req.headers.referer);
    }
  });
  



app.listen(process.env.PORT || 3000, function(){
    console.log("server is running on port 3000.");
});

