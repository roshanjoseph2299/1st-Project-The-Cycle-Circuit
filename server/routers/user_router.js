const express=require('express')
const route= express.Router();
const user_controller=require(`../controller/user_controller`)
const cart_controller=require(`../controller/cart_controller`)
const product_controller=require(`../controller/product_controller`)
const order_controller=require(`../controller/order_controller`)
const wallet_controller=require(`../controller/wallet_controller`)
const coupon_controller=require(`../controller/coupon_controller`)

const fs=require('fs')
const twilio_sms = require('../controller/twilio_sms')
const Cart=require('../models/cart')
const Wallet = require("../models/wallet_model");
const { Product } = require("../models/product");


route.get('/lowtohigh',user_controller.lowtohigh)
route.get('/hightolow',user_controller.hightolow)
route.post('/search', (req, res) => {
  const searchInput = req.body.searchInput;

  // Use the search input to perform an aggregation query
  Product.aggregate([
    {
      $match: {
        name: {
          $regex: searchInput,
          $options: 'i'
        }
      }
    }
  ])
    .then(products => {
      res.json(products);
    })
    .catch(error => {
      console.error('Error:', error);
      res.status(500).send('Internal Server Error');
    });
});



route.get('/',user_controller.user_homepage)
route.get('/login_page',user_controller.user_login)
route.get('/user_detail',user_controller.user_page)
route.get('/edit_user_details',user_controller.edituser)
route.get('/editUserAssress',user_controller.edituserAddress)


route.post('/update_user/:id',user_controller.update_user)
route.post('/addUserAddress/:id',user_controller.addUserAddress)

route.get('/logout_user',user_controller.user_logout)
route.post('/login',user_controller.find_user)
route.get('/forgot_password',user_controller.forgot_password)
route.get('/signup_user', user_controller.get_add_user_signup);
// route.post('/add_user_signup',user_controller.add_user_signup)

route.get('/product_detail/:id/:slug',product_controller.product_details)

route.get('/add_to_cart/:id',cart_controller.add_to_cart)
route.get('/view_cart',cart_controller.view_cart)
route.post('/incrementQuantity', cart_controller.incrementQuantity)
route.post('/decrementQuantity', cart_controller.decrementQuantity)
route.get('/deleteCartItem/:id', cart_controller.deleteCartItem)

route.get('/userAddress', user_controller.userAddress)
route.post('/userAddress', user_controller.post_address)
route.post('/checkout', user_controller.checkout_page)
route.post('/checkoutproceed', user_controller.checkout)

route.post('/redeemCoupon', coupon_controller.redeem_coupon)

route.get('/orderDetails', order_controller.orderDetails)
route.post('/cancelOrder/:id', order_controller.cancelOrder)
route.post('/returnOrder/:id', order_controller.returnOrder)
route.get('/orderView/:id', order_controller.order_view)
route.get('/paypal-success', user_controller.paypal_success)
route.get('/paypal-err', user_controller.paypal_err)

route.get('/userWallet',wallet_controller.userwallet)
route.post('/wallet_buy', wallet_controller.wallet_pay)

route.get('/downloadInvoice/:id',order_controller.downloadinvoice)




















module.exports=route;