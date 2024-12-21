const jwt = require('jsonwebtoken');

const isAdminLoggedIn = (req, res, next) => {
    try {
        // Check if the token exists
        const token = req.cookies.admin_token;
        if (!token) {
            req.flash("error_admin", "Please log in to access the admin page.");
            return res.redirect('/admin/login-admin'); // Redirect to admin login page
        }

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach decoded data to the request object for further use
        req.admin = decoded;
       
        next(); // Proceed to the next middleware/route handler
    } catch (error) {
        console.error("Token verification failed:", error.message);

        // Handle specific JWT errors
        if (error.name === 'JsonWebTokenError') {
            req.flash("error_admin", "Invalid token. Please log in again.");
        } else if (error.name === 'TokenExpiredError') {
            req.flash("error_admin", "Session expired. Please log in again.");
        } else {
            req.flash("error_admin", "Authentication failed. Please try again.");
        }

        return res.redirect('/admin/login-admin'); // Redirect to admin login page
    }
};

module.exports = isAdminLoggedIn;
