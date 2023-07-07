const dotenv = require('dotenv')

  const express=require('express');
  const mongoose =require('mongoose');
  const session=require('express-session');
  const bodyparser=require('body-parser')
  const path=require('path');
  const multer=require('multer')
  const nocache=require('nocache')
  const{v4 :uuidv4}=require('uuid')

  const adminRouter=require('./server/routers/admin_router.js')
  const userRouter=require('./server/routers/user_router.js')

  const twilioRouter = require('./server/routers/twilio-router.js')


  const app=express();
  PORT = 5000
DB_URI = 'mongodb://0.0.0.0:27017/project';


const jsonParser = bodyparser.json()



  app.set('view engine','ejs');

  // //error
  app.use((err,req,res,next)=>{
    console.error('there is an error : ',err);
    res.render('error');
  })


  // app.use('/css',express.static(path.resolve(__dirname,'public/userstyle/css')))
  // app.use('/img',express.static(path.resolve(__dirname,'public/userstyle/img')))


  app.use(express.static(path.join(__dirname,'public')));

  app.use(express.static("uploads"));
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  //middlewares
  app.use(nocache());
  app.use(bodyparser.urlencoded({extended: true}));

  app.use(jsonParser);

  // app.use('/twilio-sms',twilioRouter)


  app.use(session({
    secret: uuidv4(),
    saveUninitialized:true,
    resave:false,
    cookie: { sameSite: "strict" }

  }));

  app.use((req,res,next)=>{
    res.locals.message=req.session.message;
  delete req.session.message;
  next();
  })

  //database connection
  mongoose.connect(DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const db=mongoose.connection;
  db.on("error",(error)=>console.log('error'));
  db.once("open",()=>console.log("connected to the database"));


  app.use('/', userRouter)
  app.use('/', adminRouter)
  app.use('/',twilioRouter)


  // Catch-all route for 404 page
app.use((req, res) => {
  res.status(404).render('user/error');
});

  app.listen(PORT,()=>{
    console.log(`server started at http://localhost:${PORT}`);
  })