//imports
const express = require('express');
const app = express();
require('dotenv').config();
const flash = require('connect-flash');
const expressSession = require('express-session');
const path = require('path');
const port = process.env.PORT || 3000;
const indexRoute = require('./server/Routes/indexRoute');
const userRoute = require('./server/Routes/userRoute');
const adminRoute = require('./server/Routes/adminRoute');
const connectDB = require('./server/config/mongoose-connect');
connectDB();
const ejsLayout = require('express-ejs-layouts');
const cookiePraser = require('cookie-parser');
const cookieParser = require('cookie-parser');


//middlewares
app.use(express.json());
app.use(express.urlencoded({extended : true}));
app.use(express.static(path.join(__dirname, "public")));
app.use(expressSession({
    resave: false, 
    saveUninitialized : false,
    secret : process.env.SESSION_SECRET_KEY
}))
app.use(flash());
app.use(ejsLayout);
app.set('view engine', 'ejs');
app.set('layout', "layouts/layout")
app.use(cookieParser());




//routes
app.use("/" , indexRoute);
app.use("/user" , userRoute);
app.use("/admin" , adminRoute);

app.listen(port, ()=>{
    console.log(`listening at the port : http://localhost:${port}`);
})