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


exports.userwallet =async (req,res) =>{

  if(req.session.user){
    try {
      const userId = req.session.user?._id
      const user = req.session.user
      let sum = 0

      const walletbalance = await Wallet.findOne({ userId: userId }).populate('orderId');
      const orderdetails = await orderSchema.find({ user: userId , status: "Amount refunded" }).populate('items.product');

      if (walletbalance) {

        const usedAmount = walletbalance.usedAmount;

        
        sum += walletbalance.balance;
        const wallet = walletbalance.orderId
        res.render("user/wallet", { user, wallet, sum, walletbalance, orderdetails,usedAmount  })
      } else {
        res.render('user/wallet', { user, wallet: null, sum, walletbalance: null, orderdetails , usedAmount: 0 });
      }


    } catch (error) {
      console.log(error);
      res.status(500).send("Server Error")
    }
  } else {
    res.redirect("/login")
  }


}


exports. wallet_pay = async(req,res)=>{
if(req.session.user){
  try{
    const userId = req.session.user._id
    const wallet = await Wallet.findOne({ userId: userId });
    const cart = await cartSchema.findOne({userId:userId}).populate("products.productId")
    let totalprice=0

    const items = cart.products.map((item) => {
      const product = item.productId;
      const quantity = item.quantity;
      const price = item.productId.price
        
      totalprice += price * quantity;   
    })

    console.log(totalprice,"kk q");
    const balance = (10 / 100) * totalprice;

    let wallet_balance = wallet ? wallet.balance : 0; // Check if wallet is null or undefined
    if (balance <= wallet_balance) {
      totalprice -= balance;
      cart.wallet = balance;
      await cart.save();

      if (wallet) {
        wallet.balance -= balance;
        wallet.usedAmount += balance;
        await wallet.save();

        console.log(wallet.balance, "after");
      }
    }
    res.json({
      success: true,
      message: "Wallet add Successful",
      totalprice,
      wallet_balance
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
} else {
  res.redirect("/login")
}
};