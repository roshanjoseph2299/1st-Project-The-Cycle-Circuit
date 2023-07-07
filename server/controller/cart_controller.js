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


exports.add_to_cart = async (req, res) => {
  try {
    const userId = req.session.user?._id;
    const productId = req.params.id;

    if (!userId) {
      return res.redirect('/login_page');
    }
   
    let userCart = await cartSchema.findOne({ userId: userId });

    if (!userCart) {
      // If the user's cart doesn't exist, create a new cart
      const newCart = new cartSchema({ userId: userId, products: [] });
      await newCart.save();
      userCart = newCart;
    }

    const productIndex = userCart.products.findIndex(
      (product) => product.productId == productId
    );

    console.log(productIndex);

    if (productIndex === -1) {
      // If the product is not in the cart, add it
      userCart.products.push({ productId : productId, quantity: 1 });
    } 
    await userCart.save();

  
    const product = await Product.findById(productId);
    const slug = slugify(product.name ,{lower:true});

    res.render("user/product_detail", { product,slug ,user: req.session.user});
    console.log("Product added to cart successfully");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};



exports.view_cart = async (req, res) => {
  const user = req.session.user;
  if (user) {
    try {
      const userId = req.session.user?._id;
      const data = await userSchema.findOne({ _id: userId });
      const cart = await cartSchema
        .findOne({ userId: userId })
        .populate("products.productId");
        let products=[]
      if (cart) {
        let products = cart.products;
        res.render("user/cart", { cart, user, products, data: data.address });
      } else {
        res.render("user/cart", { cart, user, products, data: data.address });
      }
      // res.render('user/cart',{user,products})
    } catch (error) {
      console.error(error);
      res.status(500).send("Some Error occurred");
    }
  } else {
    res.redirect("/login_page");
  }
};


exports.incrementQuantity = async (req, res) => {
  console.log("quantity incremented");
  const userId = req.session.user?._id;
  const cartId = req.body.cartId;
  console.log(userId);

  try {
    let cart = await cartSchema
      .findOne({ userId: userId })
      .populate("products.productId");
    let cartIndex = cart.products.findIndex((items) =>
      items.productId.equals(cartId)
    );
    cart.products[cartIndex].quantity += 1;
    let result = await cart.save();
    console.log(result);

    // const total =
    //   cart.products[cartIndex].quantity *
    //   cart.products[cartIndex].productId.price;
    const product = cart.products[cartIndex].productId;
let total;

if (product.offerPrice) {
  total = cart.products[cartIndex].quantity * product.offerPrice;
} else {
  total = cart.products[cartIndex].quantity * product.price;
}
    const quantity = cart.products[cartIndex].quantity;

    res.json({
      success: "Quantity updated",
      total,
      quantity,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Failed to update quantity" });
  }
};

exports.decrementQuantity = async (req, res) => {
  console.log("quantity decremented");
  const cartItemId = req.body.cartItemId;
  const userId = req.session.user?._id;
  try {
    const cart = await cartSchema
      .findOne({ userId: userId })
      .populate("products.productId");
    const cartIndex = cart.products.findIndex((item) =>
      item.productId.equals(cartItemId)
    );
    if (cartIndex === -1) {
      return res.json({ success: false, message: "cart item not found" });
    }
    cart.products[cartIndex].quantity -= 1;
    await cart.save();
    // const total =
    //   cart.products[cartIndex].quantity *
    //   cart.products[cartIndex].productId.price;
    const product = cart.products[cartIndex].productId;
let total;

if (product.offerPrice) {
  total = cart.products[cartIndex].quantity * product.offerPrice;
} else {
  total = cart.products[cartIndex].quantity * product.price;
}
    const quantity = cart.products[cartIndex].quantity;
    res.json({
      success: true,
      message: "Quantity updated successfully",
      total,
      quantity,
    });
  } catch (error) {
    res.json({ success: false, message: "Failed to update Quantity" });
  }
};


exports.deleteCartItem = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.session.user?._id;
    const productDeleted = await cartSchema.findOneAndUpdate(
      { userId: userId },
      { $pull: { products: { productId: productId } } },
      { new: true }
    );
    if (productDeleted) {
      res.redirect("/view_cart");
    } else {
      console.log("product not deleted");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};