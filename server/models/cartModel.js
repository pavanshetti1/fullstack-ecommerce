const mongoose = require('mongoose');


const cartSchema = mongoose.Schema({
    userId : {
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    items : [ {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        price: {
            type: Number,
            required: true
        }
    } ],
    totalPrice: {
        type: Number,
        required: true,
        default: 0
    }, 
})

module.exports = mongoose.model('Cart', cartSchema);