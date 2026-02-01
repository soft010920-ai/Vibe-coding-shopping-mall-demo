const mongoose = require('mongoose');
const orderSchema = require('./orderSchema');

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
