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
const PDFDocument = require('pdfkit');

const slugify=require('slugify')
const Category =require('../models/category').Category;

exports.orderDetails = async (req, res) => {
  if (req.session.user) {
    const user = req.session.user;
    const userId = req.session.user?._id;

    const orders = await orderSchema
      .find({ user: userId })
      .populate("user")
      .populate("items.product");
    res.render("user/orderlist", { orders, user });
  } else {
    res.redirect("/login_page");
  }
};

// exports.cancelOrder = async (req, res) => {
//   const user = req.session.user;
//   if (user) {
//     try {
//       const id = req.params.id;
//       const cancelReason =req.body.cancelReason;
//       const order = await orderSchema.findByIdAndUpdate(
//         id,
//         {
//           status: "Cancelled",
//           cancelReason : cancelReason
//         },
//         { new: true }
//       );
//       res.redirect("/orderDetails");
//     } catch (error) {
//       console.log(error);
//       res.status(500).send("Server Error");
//     }
//   } else {
//     res.redirect("/login");
//   }
// };

exports.cancelOrder = async (req, res) => {
  const user = req.session.user;
  const userId = req.session.user?._id;
  if (user) {
    try {
      const id = req.params.id;
      const cancelReason =req.body.cancelReason;
      const order = await orderSchema.findById(id)

      if(order.payment_method=== 'cod'){
        const updatedOrder  = await orderSchema.findByIdAndUpdate(
          id,
          {
            status: "Cancelled",
            cancelReason : cancelReason
          },
          { new: true }
        );
        res.redirect("/orderDetails");
      }else if(order.payment_method==='paypal'){
        const wallet = await Wallet.findOne({ userId: userId });
        if (!wallet) {
          return res.status(404).send("Wallet not found");
        }
        const refundAmount = order.total;
        wallet.balance += refundAmount;
        wallet.transactions.push(`Refund of ${refundAmount} for order ${order._id}`);
        await wallet.save();

        const updatedOrder   = await orderSchema.findByIdAndUpdate(
          id,
          {
            status: "Amount refunded",
            cancelReason : cancelReason
          },
          { new: true }
        );

        res.redirect("/orderDetails");

      }

     
    } catch (error) {
      console.log(error);
      res.status(500).send("Server Error");
    }
  } else {
    res.redirect("/login");
  }
};

exports.returnOrder = async (req, res) => {
  const user = req.session.user;
  const userId = req.session.user?._id;
  const order = await orderSchema
  .findOne({ user: userId  })
  .populate("items.product").populate("items.quantity")

  if (user) {
    try {
      const id = req.params.id;
      const cancelReason =req.body.cancelReason;
      const order = await orderSchema.findByIdAndUpdate(
        id,
        {
          status: "Amount refunded",
          cancelReason : cancelReason
        },
        { new: true }
      );

       // Get the total amount from the order
       const refundAmount = order.total;


  for (const item of order.items) {
        const product = item.product;
        const quantity = item.quantity;
        await Product.updateOne({ _id: product._id }, { $inc: { countInStock: +quantity } });
      }

        // Find the user's wallet and update the balance
        const wallet = await Wallet.findOne({ userId: userId });
        wallet.balance += refundAmount;
        wallet.transactions.push(`Refund from order ${order._id}`);
        await wallet.save();

      res.redirect("/orderDetails");
    } catch (error) {
      console.log(error);
      res.status(500).send("Server Error");
    }
  } else {
    res.redirect("/login");
  }
};


exports.order_view = async (req, res) => {
  if(req.session.user) {
    try {
      const user = req.session.user
      const id = req.params.id

      const order = await orderSchema.findById(id)
      .populate('user')
      .populate('items.product')
      .populate('items.quantity')
      .populate('address')

      
    
      res.render("user/order_details",{order, user })
    } catch (error) {
      console.log(error);
      res.status(500).send("Server Error")
    }
  } else {
    res.redirect("/")
  } 
}






exports.downloadinvoice = async (req, res) => {
  if (req.session.user) {
    try {
      const user = req.session.user;
      const id = req.params.id;

      const order = await orderSchema.findById(id)
        .populate('user')
        .populate('items.product')
        .populate('address');

      if (!order) {
        return res.status(404).send('Order not found');
      }

      // Create a new PDF document
      const doc = new PDFDocument();

      // Set the response headers for file download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice.pdf"`);

      // Pipe the PDF document to the response stream
      doc.pipe(res);

      // Generate the PDF content
      doc.fontSize(18).text(`Invoice for Order ID: ${order._id}`, { underline: true, align: 'center' });
      doc.moveDown(0.5);

      doc.fontSize(14).text(`Order Date: ${order.createdAt.toLocaleDateString()}`);
      doc.moveDown(1.5);

      doc.rect(50, doc.y, 500, 1).fill('#000000');
      doc.moveDown(0.5);

      doc.fontSize(16).text('User Details:', { bold: true });
      doc.fontSize(12).text(`Name: ${user.name}`);
      doc.fontSize(12).text(`Email: ${user.email}`);
      doc.moveDown(1.5);

      doc.rect(50, doc.y, 500, 1).fill('#000000');
      doc.moveDown(0.5);

      doc.fontSize(16).text('Product Details:', { bold: true });
      doc.moveDown(0.5);

      order.items.forEach((item, index) => {
        doc.fontSize(12).text(`Product Name: ${item.product.name}`);
        doc.fontSize(12).text(`Quantity: ${item.quantity}`);
        doc.fontSize(12).text(`Price: ₹ ${item.price}`);
        doc.moveDown(0.5);

        if (index < order.items.length - 1) {
          doc.rect(50, doc.y, 500, 1).fill('#000000');
          doc.moveDown(0.5);
        }
      });

      doc.rect(50, doc.y, 500, 1).fill('#000000');
      doc.moveDown(1.5);

      doc.fontSize(16).text('Delivery Address:', { bold: true });
      doc.fontSize(12).text(`Address: ${order.address.address}`);
      doc.fontSize(12).text(`City: ${order.address.city}`);
      doc.fontSize(12).text(`State: ${order.address.state}`);
      doc.fontSize(12).text(`Pincode: ${order.address.pincode}`);
      doc.moveDown(1.5);

      // Finalize the PDF document
      doc.end();
    } catch (error) {
      console.log(error);
      res.status(500).send('Server Error');
    }
  } else {
    res.redirect('/');
  }
};



