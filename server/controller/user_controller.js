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
const paypal = require('paypal-rest-sdk')
paypal.configure({mod:"sandbox",
client_id:process.env.PAYPAL_CLIENT_ID,
client_secret:process.env.PAYPAL_CLIENT_SECRET})

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken)
const serviceSid = process.env.TWILIO_SERVICE_SID;




exports.lowtohigh = async (req, res) => {
  try {
    const categories = await Category.find({}).populate('products');
    const products = await Product.find().sort({ price: 1 }).populate('category');
    
    const productsWithSlug = products.map((product) => ({
      ...product._doc,
      slug: slugify(product.name, { lower: true }),
    }));
    
    if (req.session.user) {
      res.render('user/index', { details: productsWithSlug, categories: categories, user: req.session.user });
    } else {
      res.render('user/index', { details: productsWithSlug, categories: categories, user: [] });
    }
  } catch (error) {
    // Handle the error
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

exports.hightolow = async (req, res) => {
  try {
    const categories = await Category.find({}).populate('products');
    const products = await Product.find().sort({ price: -1 }).populate('category');
    const productsWithSlug = products.map((product) => ({
      ...product._doc,
      slug: slugify(product.name, { lower: true }),
    }));
    
    if (req.session.user) {
      res.render('user/index', { details:productsWithSlug , categories: categories, user: req.session.user });
    } else {
      res.render('user/index', { details: productsWithSlug, categories: categories, user: [] });
    }
  } catch (error) {
    // Handle the error
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};


// exports.user_homepage = async (req, res) => {
//   const categories = await Category.find({}).populate('products');
//     const product = await Product.find({}).populate('category');
  
//     const productsWithSlug = product.map((product) => ({
//       ...product._doc,
//       slug: slugify(product.name, { lower: true }),
//     }));
//   if (req.session.user) {
  
//     res.render("user/index", { user: req.session.user, details: productsWithSlug , categories : categories });
//     //console.log(user)
//   } else {
//     const product = await Product.find({});
//     res.render("user/index", { user: req.session.user, details: productsWithSlug ,categories :categories });
//   }
// };
exports.user_homepage = async (req, res) => {
  const categories = await Category.find({}).populate('products');
  
  let productsWithSlug = [];
  
  if (categories.length > 0) {
    const categoryIds = categories.map(category => category._id);
    const products = await Product.find({ category: { $in: categoryIds } }).populate('category');
    
    productsWithSlug = products.map(product => ({
      ...product._doc,
      slug: slugify(product.name, { lower: true }),
    }));
  }
  
  if (req.session.user) {
    res.render("user/index", { user: req.session.user, details: productsWithSlug, categories, products: productsWithSlug });
  } else {
    res.render("user/index", { user: req.session.user, details: productsWithSlug, categories, products: productsWithSlug });
  }
};



exports.edituser =async(req,res)=>{
  if(req.session.user){
    try{
      const id=req.session.user?._id
      const user = await userSchema.findOne({_id:id})
      res.render('user/edit_user_details',{user})
    }catch (error) {
        
    }
 
}else{
  res.render('user/user_login')
}}

exports.edituserAddress =async(req,res)=>{
  if(req.session.user){
    try{
      const id=req.session.user?._id
      const user = await userSchema.findOne({_id:id})
      res.render('user/addUser_address',{user})
    }catch (error) {
        
    }
 
}else{
  res.render('user/user_login')
}}

exports.addUserAddress = async (req, res) => {
  try {
    const userId = req.params.id;
    console.log(userId)
    const { address, city, state, pincode } = req.body;

    const user = await userSchema.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    console.log(user)
    
    // Add the new address to the user's address array
    user.address.push({ address: address, city: city, state: state, pincode: pincode });

    await user.save();

    // Redirect to a success page or send a success response
    res.redirect('/user_detail?msg=Address added successfully');
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};



exports.update_user = async (req, res) => {
  try {
    
    // Retrieve user ID from request parameters
    const userId = req.params.id;

    // Retrieve updated user details from request body
    const { name, email, phone, address, state, city, pincode } = req.body;

    // Find the user in the database by ID
    const user = await userSchema.findById(userId);

    if (!user) {
      // User not found
      return res.status(404).json({ message: 'User not found' });
    }

    // Update the user details
    user.name = name;
    user.email = email;
    user.phone = phone;
    user.address[0].address = address;
    user.address[0].state = state;
    user.address[0].city = city;
    user.address[0].pincode = pincode;

    // Save the updated user details
    await user.save();
    const id = req.session.user?._id
    const userdetails = await userSchema.findOne({_id:userId})

    // Redirect to a success page or send a success response
    res.render('user/userprofile', {msg : "User details updated successfully", userdetails});
  } catch (err) {
    // Handle any errors that occur during the update process
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};




exports.user_login = (req, res) => {
  if(!req.session.user){
  const message = req.query.message;
  res.render("user/user_login_page", { message: message });
}else{
  res.redirect('/')
}
};


exports.user_page= async(req,res)=>{
  if (req.session.user) {
    try {
        const id = req.session.user?._id
        const userdetails = await userSchema.findOne({_id:id})
        res.render("user/userprofile",{userdetails : userdetails ,  msg: req.query.msg  })
    } catch (error) {
        
    }
    
}else{
    res.redirect("/")
}
}


exports.forgot_password = (req, res) => {
  res.render("user/forgot_password");
};



exports.user_logout = async (req, res) => {
  try {

  

    await req.session.destroy();
    const categories = await Category.find({}).populate('products');
    const product = await Product.find({}).populate('category');
  

    const productsWithSlug = product.map((product) => ({
      ...product._doc,
      slug: slugify(product.name, { lower: true }),
    }));

    res.render("user/index", {
      message: "Logout successfully",
      details: productsWithSlug,
      categories : categories
    });
  } catch (err) {
    console.log(err);
    res.send("error");
  }
};






exports.find_user = async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
                                          

  try {
    const sweetAlert =true
    const user = await userSchema.findOne({ email: email });

    if (user) {
      if (user.isBlocked) {
       
        res.render("user/user_login_page", {
          message: "Your account is blocked. Please contact support.",
        });
      } else {
        const isMatch = await bcrypt.compare(password, user.password);
        console.log(user);
        if (isMatch) {

          req.session.user = user;
          res.redirect("/");
        } else {
          res.render("user/user_login_page", { message: "Invalid entry" });
        }
      }
    } else {
      res.render("user/user_login_page", { message: "Invalid email or password" });
    }
  } catch (error) {
    console.error(error);
    res.render("user/user_login_page", {
      message: "An error occurred while logging in",
    });
  }
};



exports.get_add_user_signup = (req, res) => {
  res.render("user/signup_page");
};





exports.add_user_signup = async(req, res) => {

  const existingEmail = await userSchema.find({ email: req.body.email });

  const existingPhone = await userSchema.find({ phone: req.body.phone });

  if (existingEmail.length > 0) {
    return res.render('user/user_login', { message : "Email allready exists" });
  }

  if (existingPhone.length > 0) {
    return res.render('user/user_login', { message : "Mobile allready exists" });
  }



//   const saltRounds = 10;
//   bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
//     if (err) {
//       res.status(500).send({
//         message: err.message || "some error occured while hashing the password",
//       });
//       return;
//     }
//     const user = new userSchema({
//       name: req.body.name,
//       email: req.body.email,
//       phone: req.body.phone,
//       password: hash,
//     });
//     user
//       .save()
//       .then(() => {
//         res.render("user/user_login_page");
//       })
//       .catch((err) => {
//         res.json({ message: err.message, type: "danger" });
//       });
//   });
};











exports.userAddress = async (req, res) => {
  const user = req.session.user;
  if (user) {
    try {
      const userId = req.session.user?._id;
      const data = await userSchema.findOne({ _id: userId });
      res.render("user/add_address", { data: data.address, user });
    } catch (error) {
      console.error(error);
      res.status(500).send("Some Error occurred");
    }
  } else {
    res.redirect("/login_page");
  }
};

exports.post_address = async (req, res) => {
  try {
    const userId = req.session.user?._id;
    const {  address, pincode, city, state } = req.body;

    // Find the user by a specific identifier
    const user = await userSchema.findOne({ _id: userId });
    console.log(user);

    if (!user) {
      res.status(404).send("User not found");
      return;
    }

    // Push the new address data to the existing address array
    user.address.push({ address, pincode, city, state });

    // Save the updated user document
    await user.save();
    res.redirect('/view_cart');
  } catch (error) {
    console.error(error);
    res.status(500).send("Error finding/updating user.");
  }
}


exports.checkout_page = async (req, res) => {
  const username = req.session.user;
  if (req.session.user) {
    try {
      const addressId = req.body.address; // Retrieve the selected addressId from the submitted form
      console.log("Selected address ID is: " + addressId);
      const payment = req.body.payment_method;
      const id = req.params.id;
      const userId = req.session.user?._id;
      const data = await userSchema.findOne({ _id: userId });
      const user = await userSchema.findOne({ _id: userId });
      const coupon = await couponSchema.find();

      if (user) {
        const address = user.address.find((addr) => addr._id.toString() === addressId);

        if (address) {
          const cart = await cartSchema
            .findOne({ userId: user })
            .populate("products.productId");

          res.render("user/checkout", {
            user,
            cart,
            address,
            data: data.address,
            coupon,
            username
          });
        } else {
          res.status(404).send("Address not found");
        }
      } else {
        res.status(404).send("User not found");
      }
    } catch (error) {
      console.log(error);
      res.status(500).send("Server error");
    }
  } else {
    res.redirect("/login_page");
  }
};



let paypalTotal = 0
exports.checkout = async (req, res) => {

  const user = req.session.user;
  console.log(user)
  if (user) {
    try {
      const id = req.params.id;
      const userId = req.session.user?._id;
      const payment = req.body.payment;
      let lastAddress ={
        name: req.body.name,
        phone: req.body.phone,
        address: req.body.address,
        city: req.body.city,
        state:req.body.state,
        pincode: req.body.pincode,
      }
      
      //  null; // Declare and assign a default value to lastAddress
      
      const user = await userSchema.findById(userId);
      
      if (!user) {
        console.log('User not found');
        return;
      }
      
      // Retrieve the last added address from the address array
      // lastAddress = user.address[user.address.length - 1];
      
      // console.log('Last Address:', lastAddress);
      
      // Update the address or perform other operations as needed
      
      // lastAddress ? console.log(lastAddress) : console.log("Address not found");

      const cart = await cartSchema
        .findOne({ userId: userId })
        .populate("products.productId");
      cart ? console.log(cart) : console.log("Cart not found");

      const discount = cart.total


      const items = cart.products.map((item) => {
        const product = item.productId;
        const quantity = item.quantity;
        const price = product.offerPrice ? product.offerPrice : product.price;

        if (!price) {
          throw new Error("Product price is required");
        }
        if (!product) {
          throw new Error("Product is required");
        }
        return {
          product: product._id,
          quantity: quantity,
          price: price,
        };
      });
      console.log(items);

      let totalPrice = 0;
      items.forEach((item) => {
        totalPrice += item.price * item.quantity;
      });
      if(discount){
        totalPrice -= discount
      }

      for (const item of cart.products) {
        const product = item.productId;
        const quantity = item.quantity;
        await Product.updateOne({ _id: product._id }, { $inc: { countInStock: -quantity } });
      }

      if (payment == "cod") {
        const order = new orderSchema({
          user: userId,
          items: items,
          total: totalPrice,
          status: "Pending",
          payment_method: payment,
          createdAt: new Date(),
          address: lastAddress,
        });
        await order.save();

        await cartSchema.deleteOne({ userId: userId });
         // Check if the user has a wallet
         const wallet = await Wallet.findOne({ userId: userId });

         if (!wallet) {
           // If the user doesn't have a wallet, create a new wallet
           const newWallet = new Wallet({
             userId: userId,
             balance: 0,
             usedAmount :0,
             transactions: [],
           });
           await newWallet.save();
         }


        res.render("user/order_confirm",{user: req.session.user});
      } else if (payment == "paypal") {
        const order = new orderSchema({
          user: userId,
          items: items,
          total: totalPrice,
          status: "Pending",
          payment_method: payment,
          createdAt: new Date(),
          address: lastAddress,
        });
        await order.save();

        cart.products.forEach((element) => {
          paypalTotal += totalPrice;
        });

        let createPayment = {
          intent: "sale",
          payer: { payment_method: "paypal" },
          redirect_urls: {
            return_url: "http://localhost:5000/paypal-success",
            cancel_url: "http://localhost:5000/paypal-err",
          },
          transactions: [
            {
              amount: {
                currency: "USD",
                total: (paypalTotal / 82).toFixed(2), // Divide by 82 to convert to USD
              },
              description: "Super User Paypal Payment",
            },
          ],
        };
        paypal.payment.create(createPayment, function (error, payment) {
          if (error) {
            console.log(error);
            throw error;
          } else {
            for (let i = 0; i < payment.links.length; i++) {
              if (payment.links[i].rel === "approval_url") {
                res.redirect(payment.links[i].href);
              }
            }
          }
        });
        await cartSchema.deleteOne({ userId: userId });
               // Check if the user has a wallet
               const wallet = await Wallet.findOne({ userId: userId });

               if (!wallet) {
                 // If the user doesn't have a wallet, create a new wallet
                 const newWallet = new Wallet({
                   userId: userId,
                   balance: 0,
                   usedAmount :0,
                   transactions: [],
                 });
                 await newWallet.save();
               }
      
      }

         // Check if the user has a wallet
         const wallet = await Wallet.findOne({ userId: userId });

         if (!wallet) {
           // If the user doesn't have a wallet, create a new wallet
           const newWallet = new Wallet({
             userId: userId,
             balance: 0,
             usedAmount :0,
             transactions: [],
           });
           await newWallet.save();
         }

    } catch (error) {
      console.log(error);
      res.status(404).send("Checkout failed!", error);
    }
  }
};








