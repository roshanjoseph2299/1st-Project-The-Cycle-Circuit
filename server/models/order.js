const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true,
            min: 0
        }
    }],
    total: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['Pending', 'Cancelled', 'Shipped', 'Delivered','Amount refunded'],
        default: 'Pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    payment_method: {
        type: String,
        enum: ['cod', 'creditcard', 'debitcard','paypal'],
        required: true,
    },
    address: {
        type: Object,
        // ref: "users.address",
        required: true
    },
    cancelReason:{
        default:'nil',
        type: String
    }

},{
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});


orderSchema.virtual('returnExpired').get(function() {
    const deliveryDate = this.createdAt;
    const currentDate = new Date();
    const daysPassed = Math.floor((currentDate - deliveryDate) / (1000 * 60 * 60 * 24));
    return daysPassed > 7; // Return true if more than 7 days have passed since delivery, otherwise false
  });

const Order = mongoose.model('order', orderSchema);

module.exports = Order;