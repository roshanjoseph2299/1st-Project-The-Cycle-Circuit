const userSchema = require(`../models/users`);
const bcrypt = require("bcrypt");
const { Product } = require("../models/product");
const productSchema = require("../models/product");
const multer = require("multer");
require("dotenv").config();
const cartSchema = require("../models/cart");
const orderSchema =require("../models/order")
const couponSchema = require("../models/coupon_model")
const Wallet = require("../models/wallet_model");


const slugify=require('slugify')
const Category =require('../models/category').Category;


exports.product_details = async (req, res) => {
  const username=req.session.user
  try {
    const id = req.params.id;

    const product = await Product.findById(id);
    const slug = slugify(product.name ,{lower:true});
    res.render("user/product_detail", { product,slug ,username ,user: req.session.user});
  } catch (error) {
    // Handle any errors that occur during the process

    res.status(500).send("Error retrieving product details");
  }
};
