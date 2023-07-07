const mongoose =require('mongoose')

const categorySchema= mongoose.Schema({
name:{
  type: String,
  required: true,
  unique: true
},
products: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Product',
}],

})

exports.Category=mongoose.model('Category',categorySchema)