const express = require("express");
const router = express.Router();

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const adminLayout = '../views/layouts/adminLayout';
const adminModel = require('../models/adminModel');
const productModel = require('../models/productModel');
const isAdminLoggedIn = require("../utilities/isAdminLoggedIn");

const ITEMS_PER_PAGE = 10; 


/* Get 
    index
*/

router.get("/", isAdminLoggedIn, async (req, res)=>{
    const success = req.flash("success_admin");
    const error = req.flash("error_admin");

    try {
        
    const page = +req.query.page || 1;
    const totalItems = await productModel.countDocuments();  // Get the total number of products

    // Find the products for the current page
    const products = await productModel.find({admin : req.admin._id})
      .skip((page - 1) * ITEMS_PER_PAGE)  // Skip the previous pages' items
      .limit(ITEMS_PER_PAGE);  // Limit the number of items per page

    // Calculate the total number of pages
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    const isLoggedIn = req.admin ? true : false;
    res.render("admin/admin", {layout : adminLayout, 
        success, error, 
        ifAdminIsLoggedIn:isLoggedIn,
        products,
        currentPage : page,
        totalPages   
    });

    } catch (error) {
        req.flash('error_admin', 'Failed to fetch products');
        res.redirect('/admin');
    }

})

/*
    GET
    Admin login
*/
router.get('/register', (req, res)=>{
    res.render("admin/admin-register", {title: "admin register",  layout:adminLayout,  ifAdminIsLoggedIn: false});
})

/*
    POST
    Register admin
*/

router.post("/register-admin", async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Generate salt and hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create admin user
        const admin = await adminModel.create({
            username,
            email,
            password: hashedPassword,
        });

        // Generate JWT token
        const token = jwt.sign({ email, _id:admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.cookie("admin_token", token, { httpOnly: true, secure: true });

        // Flash success message and redirect
        req.flash("success_admin", "Registered successfully");
        res.redirect('/admin');
    } catch (error) {
        console.error('Failed to register:', error.message);

        // Flash error message and respond
        req.flash("error_admin", "Failed to register. Please try again.");
        res.redirect('/admin/register-admin'); // Redirect to registration page
    }
});


/* 
    Get
    Admin Login
*/
router.get("/login-admin" , (req, res)=>{
    const success = req.flash("success_admin");
    const error = req.flash("error_admin");
    res.render("admin/login-admin", {success, error, layout:adminLayout,  ifAdminIsLoggedIn: false});
})

/* 
    POST
    Admin Login
*/

router.post("/login-admin", async  (req, res)=>{
    const {email, password} = req.body;

    try {
        const admin = await adminModel.findOne({ email });

        if( !admin ){
            req.flash("error_admin" ,"Invalid email or password");
            res.redirect("/admin/login-admin");
        }

        const match = await  bcrypt.compare(password, admin.password);
        
        if(!match){
            req.flash("error_admin" ,"Invalid email or password");
            return res.redirect("/admin/login-admin");
        }

        const token = jwt.sign({email, _id:admin._id}, process.env.JWT_SECRET);
        res.cookie("admin_token", token);
        req.flash("success_admin", "successfully logged in");
        return res.redirect("/admin");

    } catch (error) {
        req.flash("error" ,"Something occured");
        return res.redirect("/admin");
    }

});

/*
    GET 
    Admin Logout
*/
router.get("/logout", (req, res)=>{
    try {
        // Clear the authentication cookie
        res.clearCookie("admin_token");

        // Optionally, add a flash message
        req.flash("success_admin", "You have been logged out successfully!");
        
        // Redirect the user to the login page or another appropriate route
        res.redirect("/admin/login-admin");
    } catch (error) {
        console.error("Error during logout:", error.message);
        req.flash("error_admin", "Something went wrong while logging out. Please try again.");
        res.redirect("/login-admin"); // Redirect back to the dashboard or another fallback route
    }
})


/*
    GET
    product creation
*/

router.get("/products/create", isAdminLoggedIn, (req, res)=>{
    const isLoggedIn = req.admin ? true : false;
    res.render("admin/create-product", {layout : adminLayout, ifAdminIsLoggedIn:isLoggedIn});
})

/*
    POST
    product creation
*/
router.post("/products/create", isAdminLoggedIn, async (req, res)=>{
    const {name, price, category,  discount, imageURL} = req.body;
    const adminID  = req.admin._id;
    
  try {
    const product  = await productModel.create({
        name, 
        price, 
        discount,
        imageURL,
        category,
        admin: adminID
    })
    req.flash("success_admin", "product created successfully");
    res.redirect("/admin");
  } catch (error) {
    req.flash("error_admin", "some problem occured");
    console.log(error);
    res.redirect("/admin");
  }

})


/*
    GET
    edit product
*/

router.get("/products/edit/:id", isAdminLoggedIn, async (req, res)=>{

    try {
        const isLoggedIn = req.admin ? true : false;
        const product = await  productModel.findOne({_id : req.params.id});
        res.render("admin/edit-product", {product, layout:adminLayout, ifAdminIsLoggedIn : isLoggedIn});
    } catch (error) {
        console.log("cannot edit product", error);
    }
})

/*
    Post
    edit product
*/
router.post("/products/edit/:id", isAdminLoggedIn, async (req, res)=>{

    try {
        const {name, price, discount, category, stock} = req.body;
        await  productModel.findOneAndUpdate({_id : req.params.id}, {
            name, 
            price, 
            discount, 
            category, 
            stock
        });
        req.flash("success_admin", "Product edited successfully");
        res.redirect("/admin")
    } catch (error) {
        console.log("cannot edit product", error);
        
        req.flash("error_admin", "Cannot edit product");
        res.redirect("/admin")
    }
})


/*
    GET
    delete product
*/
router.get("/products/delete/:id", async (req, res) => {
    try {
      const productId = req.params.id;
  
      // Validate ObjectId format to avoid unnecessary database queries
      if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
        req.flash("error_admin", "Invalid Product ID");
        return res.redirect("/admin");
      }
  
      // Attempt deletion
      const deletedProduct = await productModel.findByIdAndDelete(productId);
  
      if (!deletedProduct) {
        req.flash("error_admin", "Product not found or already deleted");
      } else {
        req.flash("success_admin", "Product deleted successfully");
      }
      
      return res.redirect("/admin");
    } catch (error) {
      // Log detailed error for debugging
      console.error("Error while deleting product:", error);
      req.flash("error_admin", "An unexpected error occurred");
      return res.redirect("/admin");
    }
});
  

module.exports = router;