const express = require("express");
const router = express.Router();
const userModel = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const productLayout = '../views/layouts/productLayout';
const productModel = require("../models/productModel");
const cartModel = require("../models/cartModel");
const isUserLoggedIn = require("../utilities/isUserLoggedIn");

router.get("/", isUserLoggedIn,  async (req, res)=>{
    const userId = req.user._id;
    const user = await userModel.findById(userId);

   res.render("user", {user});
})


/*
    get method
    register user
*/
router.get("/register-user" , (req, res)=>{
    
    res.render("register-user" ,{title:"sign up"});
})  


/*
    post method
    register user
*/
router.post("/register-user" ,  (req, res)=>{
    const {username, email, password} = req.body;
    
   try {
        bcrypt.genSalt(10, (error, salt)=>{

            if(error) return req.flash("error", "failed to register")
            
            bcrypt.hash(password, salt, async (error, hash )=>{
                if(error) return req.flash("error", "failed to register")
                
                const user = await userModel.create({
                    username, 
                    email, 
                    password : hash
                });

                const token = jwt.sign({email, _id : user._id}, process.env.JWT_SECRET);
                res.cookie("token", token);
                
                req.flash("success", "registered successfully");
                res.redirect('/user/shop');
            })
        })

        
   } catch (error) {
        console.log('failed to register');
        req.flash("error", "failed to register");
   }
    
})


/*
    Get method
    Login
*/
router.get("/login-user" , (req, res)=>{
    const success = req.flash("success");
    const error = req.flash("error");

    res.render("login-user" ,{title:"Login", success, error});
})

/*
    POST method
    Login
*/
router.post("/login-user", async  (req, res)=>{
    const {email, password} = req.body;

    try {
        const user = await userModel.findOne({ email });

        if( !user ){
            req.flash("error" ,"Invalid email or password");
            return res.redirect("/user/login-user");
        }

        const match = await  bcrypt.compare(password, user.password)
        
        if(!match){
            req.flash("error" ,"Invalid email or password");
            return res.redirect("/user/login-user");
        }
        const token = jwt.sign({email, _id:user._id}, process.env.JWT_SECRET);
        res.cookie("token", token);
        req.flash("success", "successfully logged in");
        return res.redirect("/user/shop");

    } catch (error) {
        req.flash("error" ,"Something occured");
        return res.redirect("/user/shop");
    }

});



/*
    GET 
    logout
*/
router.get("/logout", (req, res)=>{
    res.cookie("token", "");
    return res.redirect("/user/shop");
})


/*
    GET 
    Shopping
*/

router.get("/shop" , async (req, res)=>{
    const success = req.flash("success");
    const error = req.flash("error");

    const products = await productModel.find();
    res.render('shop', {success, error, layout : productLayout, products});
    
})

/*
    GET
    add-to-cart
*/

router.get("/add-to-cart/:id", isUserLoggedIn, async (req, res)=>{
    try {   
        const userId = req.user._id;
        const productId = req.params.id;

        const product = await productModel.findById(productId);
        if(!product){
            req.flash("error", "Product not found!");
            return res.redirect("/user/shop");
        }

        let cart = await cartModel.findOne({userId});

        if(!cart){
            cart = await cartModel.create({
                userId,  
                items : [],
                totalPrice : 0
            });
        }

        const existingItem = cart.items.find(item => item.productId.equals(productId));
        if(existingItem){
            req.flash("error", "product already in cart");
            return res.redirect("/user/shop");
        }

        cart.items.push({
            productId,
            price : product.price
        })

        cart.totalPrice += product.price;
        await cart.save();

        req.flash("success", "product added successfully");
        return res.redirect("/user/shop");
    } catch (error) {
        console.log(error.message);
        req.flash("error", "some error occured! Please try again after sometime");
        return res.redirect("/user/shop");
    }
})

/*
    GET
    Cart
*/
router.get("/cart",isUserLoggedIn,  async (req, res)=>{
    const userId = req.user._id;
    const cart = await cartModel.findOne({userId}).populate("items.productId");
    res.render("cart",  {cart});
})


module.exports = router;