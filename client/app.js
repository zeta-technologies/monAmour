// var config = require("./config.js");
//var socket = require("socket.io-client")(config.server_url); // uncomment if you want to use the config.js
var socket = require("socket.io-client")("http://localhost:3000");
var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');
var url = 'mongodb://localhost:27017/myproject'; //url de la db

const Ganglion = require('openbci-ganglion').Ganglion; //npm install openbci-ganglion first
const ganglion = new Ganglion();
var origin = 0;
var cpt = 0;
var start = new Date().getTime();
var insertDocuments = function(db, callback) {
  // Get the documents collection
  var collection = db.collection('documents');
  // Insert some documents
  collection.insertMany([
    {a : 1}, {a : 2}, {a : 3}
  ], function(err, result) {
    assert.equal(err, null);
    assert.equal(3, result.result.n);
    assert.equal(3, result.ops.length);
    console.log("Inserted 3 documents into the collection");
    callback(result);
  });
}

socket.on("connect", function(){
  console.log("Connected to server");
  socket.on("updateState", function(state){
    console.log("The new state is: " + state);
    // gpio.write(config.led, !state);
    MongoClient.connect(url, function(err, db) {
      assert.equal(null, err);
      console.log("Connected successfully to server");

      insertDocuments(db, function() {
        db.close();
      });
    });

    ganglion.once('ganglionFound', (peripheral) => {
      // Stop searching for BLE devices once a ganglion is found.

      ganglion.searchStop();
      ganglion.on('sample', (sample) => {
        /** Work with sample */
        console.log(sample.sampleNumber);
        for (let i = 0; i < ganglion.numberOfChannels(); i++) {
          console.log(sample.channelData[i].toFixed(8)); //+ " Volts.");
        }


      });
      ganglion.once('ready', () => {
        ganglion.streamStart();
      });
      ganglion.connect(peripheral);
    });
    // Start scanning for BLE devices
    ganglion.searchStart();

  });
})
