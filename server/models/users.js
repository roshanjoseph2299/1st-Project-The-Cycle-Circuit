const mongoose=require('mongoose');
const userSchema=new mongoose.Schema({
  name:{
    type: String,
    required:true,
  },
  email:{
    type:String,
    required : true
  },
  phone : {
    type :Intl,
    required :true
  },
  password : {
    type : String,
    required : true
  },
  address:[{
        
        address: String,
        pincode: Number,
        city: String,
        state: String
      
  }],
 isBlocked:{
          default:false,
          type:Boolean
      },
created:{
  type :Date,
required :true,
default:Date.now,
},
coupon: [
  String
],
referalCode:{
  String
}
})

const User = new mongoose.model("users",userSchema);

module.exports=User;

