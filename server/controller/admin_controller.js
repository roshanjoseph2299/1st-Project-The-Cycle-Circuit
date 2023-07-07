const multer = require("multer");
const { Product } = require("../models/product");
const { Category } = require("../models/category");
const userSchema = require("../models/users");
const bcrypt = require("bcrypt");
const fs = require("fs");
const { model } = require("mongoose");
const orderSchema =require("../models/order")
const Swal  =require('sweetalert')
const PDFDocument= require('pdfkit')
const couponSchema = require("../models/coupon_model")
const sharp = require("sharp");



// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/");
//   },
//   filename: (req, file, cb) => {
//     cb(null, file.fieldname + "-" + Date.now());
//   },
// });

// const upload = multer({
//   storage: storage,
// }).single("image");

exports.forgot_password = (req, res) => {
  res.render("user/forgot_password");
};

exports.login_button = (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    if (email === "admin@gmail.com" && password === "123") {
      req.session.admin = true;
      res.redirect('/admin_dashboard');
    } else {
      res.render("admin/admin_login", { message: "Invalid credentials" });
    }
  } catch (error) {
    console.error(error);
    res.send("An error occurred while logging in.");
  }
};

exports.admin_logout = (req, res) => {
  req.session.destroy(function (err) {
    if (err) {
      console.log(err);
      res.send("error");
    } else {
      res.render("admin/admin_login");
    }
  });
};

exports.product_page = async (req, res) => {
  try {
    const products = await Product.find({}).populate("category");
    console.log(products)

    res.render("admin/product", { products });
  } catch (error) {
    res.send(error);
  }
};
exports.add_product = async (req, res) => {
  try {
    const categories = await Category.find().select("id name category");
    const category = req.body.category; 

    const details = {
      edit: false,
      categories: categories,
      category: category
    };

    res.render("admin/add_product", details);
  } catch (error) {
    res.send(error);
  }
};

exports.add_product_submit = async (req, res) => {
  const category = await Category.findById(req.body.category);
  if (!category) return res.status(400).send("invalid Category");


  try {
    const product = new Product({
      name: req.body.name,
      description: req.body.description,
      // image: req.files.map((file) => file.filename),
      brand: req.body.brand,
      price: req.body.price,
      category: req.body.category,
      offerPrice : req.body.offerPrice,
      countInStock: req.body.countInStock,
    });

    const croppedImages = [];

    for (const file of req.files) {
      const croppedImage = `cropped_${file.filename}`;

      await sharp(file.path)
        .resize(1000, 1000, { fit: "cover" })
        .toFile(`uploads/${croppedImage}`);

      croppedImages.push(croppedImage);
    }

    product.image = croppedImages;

    await product.save();


    // const data = await product.save();

    res.redirect("/product");
  } catch (err) {
    console.log(err);
    res.status(500).send({
      message:
        err.message || "Some error occurred while creating a create operation",
    });
  }
};

exports.delete_product = async (req, res) => {
  try {
    let id = req.params.id;

    const result = await Product.findByIdAndRemove(id);
    console.log(result)
    if (!result) {
      req.session.message = {
        type: "danger",
        message: "Product not found",
      };
    } else {
      req.session.message = {
        type: "success",
        message: "Product deleted successfully",
      };
    }

    res.redirect("/product");
  } catch (err) {
    req.session.message = {
      type: "danger",
      message: err.message,
    };
    res.redirect("/product");
  }
};

// exports.edit_product = async (req, res) => {
//   try {
//     const categories = await Category.find().select("id name category");
//     const category = req.body.category; 

//     const details = {
//       edit: false,
//       categories: categories,
//       category: category

//     };
//     const id = req.params.id;

//     const product = await Product.findById(id).exec();

//     if (product) {
//       res.render("admin/update_product", {
//         product: product,
//         details: details,
//       });
//     }
//   } catch (error) {
//     console.error(error);
//     res.redirect("/product");
//   }
// };


exports.edit_product = async (req, res) => {
  try {
    const categories = await Category.find().select("id name category");
    const id = req.params.id;
    const product = await Product.findById(id).exec();

    if (product) {
      const details = {
        edit: false,
        categories: categories,
        category: product.category
      };

      res.render("admin/update_product", {
        product: product,
        details: details,
      });
    }
  } catch (error) {
    console.error(error);
    res.redirect("/product");
  }
};

exports.update_submit = async (req, res) => {
  try {
    const id = req.params.id;

    // Find the existing product
    const existingProduct = await Product.findById(id);

    // Get the existing image filenames
    const oldImages = existingProduct.image;

    // Update the product fields
    existingProduct.name = req.body.name;
    existingProduct.description = req.body.description;
    existingProduct.brand = req.body.brand;
    existingProduct.price = req.body.price;
    existingProduct.offerPrice = req.body.offerPrice;
    existingProduct.category = req.body.category;
    existingProduct.countInStock = req.body.countInStock;

    // Update the image if new files are uploaded
    if (req.files && req.files.length > 0) {
      // Store the new image filenames
      const croppedImages = [];

      for (const file of req.files) {
        const croppedImage = `cropped_${file.filename}`;

        await sharp(file.path)
          .resize(1000, 1000, { fit: "cover" })
          .toFile(`uploads/${croppedImage}`);

        croppedImages.push(croppedImage);
      }

      existingProduct.image = croppedImages;

      // Remove old images if necessary
      if (oldImages && oldImages.length > 0) {
        // Logic to delete old images from the storage
        const fs = require("fs");
        const path = require("path");

        // Define the directory where the images are stored
        const imagesDirectory = "/server/uploads";

        // Iterate through each old image filename
        oldImages.forEach((filename) => {
          // Construct the path to the old image file
          const imagePath = path.join(imagesDirectory, filename);

          // Delete the old image file
          fs.unlink(imagePath, (err) => {
            if (err) {
              console.error("Error deleting image:", err);
            } else {
              console.log("Image deleted successfully:", filename);
            }
          });
        });
      }
    }

    // Save the updated product
    const updatedProduct = await existingProduct.save();

    req.session.message = {
      message: "Product updated successfully!",
      type: "success",
    };
    res.redirect("/product");
  } catch (err) {
    req.session.message = {
      message: err.message,
      type: "danger",
    };
    res.redirect("/product");
  }
};





exports.category = async (req, res) => {

  try {
    const message = req.query.message;
    const category = await Category.find({});
    res.render("admin/category", { details: category ,message :message });
  } catch (error) {
    res.sendStatus(500);
  }
};

exports.category_add =(req,res)=>{
res.render('admin/add_category')
}
// exports.add_category = async (req, res) => {
//   const categoryName = req.body.name;

//   try {
//     let category = await Category.findOne({ name: categoryName });

//     if (category) {
  
//       return res.redirect("/category?message=Category already exists");
//     }

//     category = new Category({
//       name: categoryName,
//     });

//     category = await category.save();

//     if (!category) {
//       return res.status(404).send("The category cannot be created!");
//     }

//     res.redirect("/category");
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Internal Server Error");
//   }
// };

exports.add_category = async (req, res) => {
  const categoryName = req.body.name;
  const category = await Category.find({});
  try {
    let category = await Category.findOne({ name: categoryName });

    if (category) {
      return res.redirect('/category?message=Category already exists')
    }

    category = new Category({
      name: categoryName,
    });

    category = await category.save();

    if (!category) {
      return res.status(404).send("The category cannot be created!");
    }

    res.redirect("/category");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};



exports.delete_category = async (req, res) => {
  try {
    let id = req.params.id;
    const result = await Category.findByIdAndRemove(id);
    if (!result) {
      req.session.message = {
        type: "danger",
        message: "category not found",
      };
    } else {
      req.session.message = {
        type: "success",
        message: "category deleted successfully",
      };
    }
  
    res.redirect("/category");
  } catch (err) {
    req.session.message = {
      type: "danger",
      message: err.message,
    };
    res.redirect("/category");
  }
};

exports.users = async (req, res) => {
  try {
    const user = await userSchema.find({}).populate('address')
    console.log(user);
    res.render("admin/users", { details: user });
  } catch (error) {
    res.sendStatus(500);
  }
};

exports.block_user = async (req, res) => {
  const { id } = req.params;

  userSchema
    .findByIdAndUpdate(
      id,
      {
        isBlocked: true,
      },
      { new: true }
    )
    .then((updatedUser) => {
      res.redirect("/users");
    })
    .catch((error) => {
      res.status(500).send("Failed to update user.");
    });
};
exports.unblock_user = async (req, res) => {
  const { id } = req.params;

  userSchema
    .findByIdAndUpdate(
      id,
      {
        isBlocked: false,
      },
      { new: true }
    )
    .then((updatedUser) => {
      res.redirect("/users");
    })
    .catch((error) => {
      res.status(500).send("Failed to update user.");
    });
};


exports.orderList = async (req, res) => {
  try {
    const order = await orderSchema
      .find()
      .populate("user")
      .populate({ path: "items.product", model: "Product", select: "name image" })
      .exec();
    res.render("admin/orderList", { order });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const id = req.params.id;
    const orderStatus = req.body.status;
    const order = await orderSchema.findByIdAndUpdate(
      id,
      {
        status: orderStatus,
      },
      { new: true }
    );
    console.log(order);
    res.redirect("/orderList");
  } catch (error) {
    console.log(error);
    res.status(501).send("Server Error");
  }
};


exports.admin_dashboard = async (req, res) => {

  if(req.session.admin){
    const today = new Date().toISOString().split("T")[0];
    const startOfDay = new Date(today);
    const endOfDay = new Date(today);
    endOfDay.setDate(endOfDay.getDate() + 1);
    endOfDay.setMilliseconds(endOfDay.getMilliseconds() - 1);
  
    const todaySales = await orderSchema.countDocuments({
      createdAt: { $gte: startOfDay, $lt: endOfDay },
      status: "Delivered",
    }).exec();
  
    const totalsales = await orderSchema.countDocuments({ status: "Delivered"}).exec()
    
    console.log('Chart script is running');
    console.log(totalsales, todaySales  )
    
    const todayRevenue = await orderSchema.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lt: endOfDay },
          status: "Delivered",
        },
      },
      { $group: { _id: null, totalRevenue: { $sum: "$total" } } }
    ]);
  
    const revenue = todayRevenue.length > 0 ? todayRevenue[0].totalRevenue : 0;
  
    const TotalRevenue = await orderSchema.aggregate([
      {
        $match: { status: "Delivered" },
      },
      { $group: { _id: null, Revenue: { $sum: "$total" } } },
    ]);
    const Revenue = TotalRevenue.length > 0 ? TotalRevenue[0].Revenue : 0;
    console.log(TotalRevenue);
  
    const Orderpending = await orderSchema.countDocuments({ status: "Pending" });
    // const Orderprocessing = await orderSchema.countDocuments({
    //   status: "Processing"
    // });
  
    const Ordershipped = await orderSchema.countDocuments({ status: "Shipped" });
  
    const Ordercancelled = await orderSchema.countDocuments({
      status: "Cancelled",
    });
  
    const salesCountByMonth = await orderSchema.aggregate([
      {
        $match: {
          status: "Delivered",
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          month: "$_id.month",
          year: "$_id.year",
          count: 1,
        },
      },
    ])
  
    res.render("admin/adminpage", {
      todaySales: todaySales,
      totalsales: totalsales,
      revenue: revenue,
      Revenue: Revenue,
      Orderpending: Orderpending,
      Ordershipped: Ordershipped,
      Ordercancelled: Ordercancelled,
      salesCountByMonth: salesCountByMonth
    });

  }else{
    res.redirect('/admin')
  }
  
};

exports.salesReport = async (req,res)=>{
  try{
  const filteredOrders = await orderSchema.find().populate("user").populate("items.product").populate("user.address")
console.log(filteredOrders)
  res.render('admin/sales_report',{orders : filteredOrders})
}catch(error){
  console.log(error)
  res.status(500).send('server error')
}
}

exports.salesReportFilter = async (req, res) => {
  try {
    const admin = req.session.admin;
    const fromDate = req.body.fromdate;
    console.log(fromDate);
    const toDate = req.body.todate;
    console.log(toDate);
    const filteredOrders = await orderSchema.find({ createdAt: { $gte: fromDate, $lte: toDate } })
      .populate("user")
      .populate("items.product")
      .populate("user.address");

    res.render("admin/sales_report", { orders: filteredOrders });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error");
  }
};





exports.salesReportDownload = async (req, res) => {
  try {
    const admin = req.session.admin;
    const fromDate = req.body.fromdate;
    console.log(fromDate);
    const toDate = req.body.todate;
    console.log(toDate);
    const filteredOrders = await orderSchema
      .find({ createdAt: { $gte: fromDate, $lte: toDate } })
      .populate('user')
      .populate('items.product')
      .populate('user.address');

    // Create a new PDF document
    const doc = new PDFDocument();

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="sales_report.pdf"');

    // Create a write stream to pipe the PDF document to the response
    const stream = doc.pipe(res);

    // Generate the PDF content
    doc.fontSize(18).text('Sales Report', { align: 'center' });
    doc.fontSize(14).text(`From: ${fromDate}   To: ${toDate}`, { align: 'center', margin: [0, 10] });

    // Define the table headers
    const tableHeaders = ['Date', 'Order ID', 'User Name', 'Products', 'Quantity', 'Price', 'Payment Method'];

    // Define the table rows
    const tableRows = filteredOrders.map((order) => {
      const productNames = order.items.map((item) => item.product?.name).join(', ');
      const quantities = order.items.map((item) => item.quantity).join(', ');
      const prices = order.items.map((item) => item.price).join(', ');

      return [
        order.createdAt.toLocaleDateString(),
        order._id.toString(),
        order.user?.name,
        productNames,
        quantities,
        prices,
        order.payment_method,
      ];
    });

    // Set up table properties
    const cellWidth = 80; // Adjust the cell width as per your requirement
    const tableTop = 200;
    const tableLeft = 25;
    const lineHeight = 30;
    const columnSpacing = 3; // Adjust the column spacing as per your requirement

    // Draw the table headers
    tableHeaders.forEach((header, columnIndex) => {
      const headerLeft = tableLeft + columnIndex * (cellWidth + columnSpacing);
      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .text(header, headerLeft, tableTop, { width: cellWidth, align: 'left' });
    });

    // Draw the table rows
    tableRows.forEach((row, rowIndex) => {
      row.forEach((cell, columnIndex) => {
        const cellLeft = tableLeft + columnIndex * (cellWidth + columnSpacing);
        doc
          .font('Helvetica')
          .fontSize(9)
          .text(cell, cellLeft, tableTop + (rowIndex + 1) * lineHeight, {
            width: cellWidth,
            align: 'left',
          });
      });
    });

    // Finalize the PDF document
    doc.end();
  } catch (error) {
    console.log(error);
    res.status(500).send('Server error');
  }
};



exports.add_coupon = (req, res) => {
  res.render('admin/addCoupon')
}

exports.addCoupon = async (req, res) => {
  try {
    const {code, discount, expiryDate} = req.body
    const existingCoupon = await couponSchema.findOne({code:code})

    if(discount > 2000) {
      return res.render('admin/addCoupon', {message: 'Offer price exeedes, please decrease the amount!'})
    } else if(discount <= 0) {
      return res.render('admin/addCoupon', {message: 'Please add some discount to the coupon!'})
    }

    if(existingCoupon){
      return res.render('admin/addCoupon', {message: 'Coupon already exists!'})

    } else {
      const coupon = new couponSchema({
        code: req.body.code,
        startingDate: req.body.startingDate,
        expiryDate: req.body.expiryDate,
        discount: req.body.discount
      })
      console.log(coupon);
      await coupon.save();
      res.redirect('/couponPage')
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: error.message || "Some error occurred while creating the coupon."
    })
  }
}


exports.coupon_page = async (req, res) => {
  try {
    const coupon = await couponSchema.find()
    res.render('admin/couponPage', { coupon })
  } catch (error) {
      res.status(500).send("Server Error");
    };
};

exports.delete_coupon = async (req, res) => {
  try {
    const {id} = req.params
    const result = await couponSchema.findByIdAndRemove(id)
    if (result) {
      res.redirect('/couponpage')
    } else {
      res.render('couponpage')
    }
  }catch (error) {
    res.status(500).send(error.message);
  }
}