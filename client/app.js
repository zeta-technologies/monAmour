// var config = require("./config.js");
//var socket = require("socket.io-client")(config.server_url); // uncomment if you want to use the config.js
var socket = require("socket.io-client")("http://localhost:3000");
var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');
var url = 'mongodb://localhost:27017/monAmour'; //url de la db

const Ganglion = require('openbci-ganglion').Ganglion; //npm install openbci-ganglion first
const ganglion = new Ganglion();
var origin = 0;
var cpt = 0;
var start = new Date().getTime();
var compteur = 0;
// var insertDocuments = function(db, callback) {
  // Get the documents collection
//   var collection = db.collection('documents');
//   // Insert some documents
//   collection.insertMany([
//     {a : 1}, {a : 2}, {a : 3}
//   ], function(err, result) {
//     assert.equal(err, null);
//     assert.equal(3, result.result.n);
//     assert.equal(3, result.ops.length);
//     console.log("Inserted 3 documents into the collection");
//     callback(result);
//   });
// }
var ch1_array = [];
var ch2_array = [];
var ch3_array = [];
var ch4_array = [];
var mainArray = [ch1_array, ch2_array, ch3_array, ch4_array];
var insertDocuments = function(db, array, callback) {
    var collection = db.collection('documents');
    // Insert some documents
    collection.insertOne({
        "user": {
           "name": "Simon",
           "age": "23",
           "city": "Paris"
        },
        "sessions": {
          "session_1": {
            "ch1": array[0],
            "ch2": array[1],
            "ch3": array[2],
            "ch4": array[3]
          }
        }
    }
    , function(err, result) {
      assert.equal(err, null);
      assert.equal(1, result.result.n);
      assert.equal(1, result.ops.length);
      console.log("Inserted data from user of the last 300 points saved, documents into the collection");
      callback(result);
    });
}

socket.on("connect", function(){
  console.log("Connected to server");
  socket.on("On", function(state){
    console.log("The streaming is" + state);
    // gpio.write(config.led, !state);

    console.log("looking for ganglion");
    ganglion.once('ganglionFound', (peripheral) => {
      console.log("ganglion found");
      // Stop searching for BLE devices once a ganglion is found.
      ganglion.searchStop();

      ganglion.on('sample', (sample) => {
        if (compteur < 300) {
          // console.log(sample.sampleNumber);
          for (let i = 0; i < ganglion.numberOfChannels(); i++) {
            // console.log(sample.channelData[i].toFixed(8)); //+ " Volts.");
            mainArray[i].push(sample.channelData[i].toFixed(8));

          }
        compteur = compteur + 1;
        }
        else {
          ganglion._disconnected();
          compteur = 0;
          console.log("ganglion disconnected");
          // console.log(mainArray);
          MongoClient.connect(url, function(err, db) {
            assert.equal(null, err);
            console.log("Connected successfully to server");

            insertDocuments(db, mainArray, function(){
              var collection = db.collection('documents');
                // Find some documents
                collection.find({"user.name" : "Simon"}).toArray(function(err, docs) {
                  assert.equal(err, null);
                  console.log("Found the following records");
                  console.log(docs[0].sessions.session_1.ch1);
                  // callback(docs);
                });
              db.close();
            });
            // updateDocument(db, function() {
            //   db.close();
            // });
            // findDocuments(db, function(){
            //   db.close()
            // });
            console.log(db)// assert.equal(null, err);
            console.log("Connected successfully to server Mongodb");
          });
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
