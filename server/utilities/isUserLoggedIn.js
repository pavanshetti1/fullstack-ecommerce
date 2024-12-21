const jwt = require('jsonwebtoken');

const isUserLoggedIn = (req, res, next) => {
    try {
        // Check if the token exists
        const token = req.cookies.token;
        if (!token) {
            req.flash("error", "Please log in to add to cart.");
            return res.redirect('/user/login-user'); 
        }

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach decoded data to the request object for further use
        req.user = decoded;
       
        next(); // Proceed to the next middleware/route handler
    } catch (error) {
        console.error("Token verification failed:", error.message);

        // Handle specific JWT errors
        if (error.name === 'JsonWebTokenError') {
            req.flash("error", "Invalid token. Please log in again.");
        } else if (error.name === 'TokenExpiredError') {
            req.flash("error", "Session expired. Please log in again.");
        } else {
            req.flash("error", "Authentication failed. Please try again.");
        }

        return res.redirect('/user/login-user');
    }
};

module.exports = isUserLoggedIn;
