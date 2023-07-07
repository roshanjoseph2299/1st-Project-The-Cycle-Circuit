const express=require('express')
const route= express.Router();
const admin_controller=require(`../controller/admin_controller`)
const fs=require('fs')
const multer=require('multer')
const path=require('path')

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // make sure directory exists
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // remove spaces and special characters from original filename
    const originalname = file.originalname.replace(/[^a-zA-Z0-9]/g, "");
    // set filename to fieldname + current date + original filename
    cb(null, `${file.fieldname}_${Date.now()}_${originalname}`);
  },
});
  
var upload = multer({
  storage: storage,
})

//for upload image
// const storage= multer.diskStorage({
//   destination : (req,file,cb)=>{
//     cb(null,'uploads')
//   },
//   filename :(req,file,cb)=>{
    
//     cb(null, Date.now() + path.extname(file.originalname) );

//   }
// }) 
// var upload =multer({
//   storage:storage,
// }).single("image");

// const Storage  = multer.diskStorage({
//   destination : "uploads",
//   filename:(req,file,cb)=>{
//     cb(null,file.originalname);
//   },
// })

// const upload =multer({
//   storage : Storage
// }).single('testImage')


route.get('/admin', (req, res) => {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  
  if (!req.session.admin) {
    res.render('admin/admin_login');
  } else {
    res.redirect("/admin_dashboard");
  }
});

// route.get('/admin_dashboard',(req,res)=>{
//   res.render('admin/adminpage')
// })


route.get('/admin_dashboard', admin_controller.admin_dashboard)


route.post('/admin_login_button',admin_controller.login_button)
route.get('/adminLogout',admin_controller.admin_logout)

route.get('/product',admin_controller.product_page)
route.get('/category',admin_controller.category)
route.get('/users',admin_controller.users)

route.get('/block_user/:id',admin_controller.block_user)
route.get('/unblock_user/:id',admin_controller.unblock_user)

   



route.get('/add_product' ,admin_controller.add_product)
route.post('/add_product_submit',upload.array('image', 5),admin_controller.add_product_submit)
route.get('/delete_product/:id',admin_controller.delete_product)
route.get('/edit_product/:id',admin_controller.edit_product)
route.post('/update_submit/:id',upload.array('image', 5),admin_controller.update_submit)


route.post('/add_category',admin_controller.add_category)
route.get('/delete_category/:id',admin_controller.delete_category)
route.get('/add_category',admin_controller.category_add)

route.get('/orderList',admin_controller.orderList)
route.post('/update_order/:id', admin_controller.updateOrder)


route.get('/salesReport',admin_controller.salesReport)
route.post('/adminSalesFilter',admin_controller.salesReportFilter)
route.post('/adminSalesDownload',admin_controller.salesReportDownload )

route.get('/addcoupon', admin_controller.add_coupon)
route.post('/addCoupon',  admin_controller.addCoupon)
route.get('/couponPage',admin_controller.coupon_page)
route.get('/delete-coupon/:id',admin_controller.delete_coupon)




module.exports=route

