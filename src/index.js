//----------------- Importing Module and Packages -------------->
import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer'
import route from './routes/route.js';
const app = express()

app.use(express.json())
app.use(multer().any())

//--------------- Make Relation Between MongoDb and Nodejs with MongoDb Cluster Link  ----------------//
mongoose.connect('mongodb+srv://riju:riju@cluster0.s4hmv.mongodb.net/group1Database', {
  useNewUrlParser: true
}).then(() => console.log(`MongoDb is connected`))
  .catch(err => console.log(err.message))


//------------- Global Middleware for All Route --------------//
app.use('/', route)

//---------------- PORT ------------------//
app.listen(process.env.PORT || 3000, function () {
  console.log('Express App Running on Port: ' + (process.env.PORT || 3000))
});


