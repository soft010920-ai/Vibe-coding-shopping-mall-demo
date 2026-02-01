const mongoose = require('mongoose');
const productSchema = require('./productSchema');

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
