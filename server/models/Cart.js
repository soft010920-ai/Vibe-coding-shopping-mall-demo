const mongoose = require('mongoose');
const cartSchema = require('./cartSchema');

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
