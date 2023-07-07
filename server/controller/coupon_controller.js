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


exports.redeem_coupon = async (req, res) => {
  const { coupon } = req.body;
  console.log(coupon);
  const userId = req.session.user?._id;
  console.log(userId);

  const findCoupon = await couponSchema.findOne({ code: coupon })
  const userCoupon = await userSchema.findOne({_id: userId})

  if(userCoupon.coupon.includes(coupon)) {
    return res.json({
      success: false,
      message: "Coupon Already used"
    })
  }

  if(!findCoupon || findCoupon.status === false) {
    return res.json({
      success: false,
      message: findCoupon ? "Coupon Deactivated" : "Coupon not found",
    })
  }

  userCoupon.coupon.push(coupon)
  await userCoupon.save()

  const currentDate = new Date()
  const startingDate = new Date(findCoupon.startingDate)
  const expiryDate = new Date(findCoupon.expiryDate)


  if(currentDate > expiryDate) {
    return res.json({
      success: false,
      message: "Coupon Expired"
    })
  } else if(currentDate < startingDate) {
    return res.json({
      success: false,
      message: "Coupon hasn't bigginned yet, wait for it"
    })
  }

  const amount = findCoupon.discount

  res.json({
    success: true,
    message: "Coupon available",
    findCoupon,
    amount: parseInt(amount)
  })

  try {
    const cart = await cartSchema.findOne({ userId: userId })
    

    if(!cart) {
      console.log("Cart not found");
      return;
    }

    cart.total = amount
    await cart.save()
  } catch (error) {
    console.error("Error updating cart:", error);
  }  
}
