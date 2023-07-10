
const controller=require('./user_controller')
require('dotenv').config();
const userSchema = require("../models/users");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken)
const serviceSid = process.env.TWILIO_SERVICE_SID;
const bcrypt = require('bcrypt');
const Wallet = require("../models/wallet_model");






exports.send_password_OTP = async (req, res, next) => {
  const { phone } = req.body;
  req.session.phone=phone
  try {
    const otpResponse = await client.verify.v2
      .services(serviceSid)
      .verifications.create({
        to: "+91"+phone,
        channel: "sms",
      });
      res.render('user/forgot_password',{message:"otp send successfully"});
  } catch (error) {
    res.status(error?.status || 400).send(error?.message || "Something went wrong!");
  }
  
};



exports.verify_password_OTP = async (req, res) => {
  const verificationCode =req.body.otp;
  const phoneNumber = req.session.phone;
  const password=req.body.password;
  

  if (!phoneNumber) {
    res.status(400).send({ message: "Phone number is required" });
    return;
  }

  try {
    // Verify the SMS code entered by the user
    const verification_check = await client.verify.v2.services(serviceSid).verificationChecks.create({ to: '+91' + phoneNumber, code: verificationCode });

    if (verification_check.status === 'approved') {
      // If the verification is successful, do something
    
      // res.render('home', { message: "Verification successful" });
      userSchema.findOne({ phone: phoneNumber })
      .then((user) => {
        const saltRounds = 10; // You can adjust the number of salt rounds as needed
        bcrypt.hash(password, saltRounds, (err, hash) => {
          if (err) {
            res.status(500).send({
              message: err.message || "Some error occurred while hashing the password"
            });
          } else {
            userSchema.findOneAndUpdate({  phone: phoneNumber }, { password: hash }, { useFindAndModify: false })
              .then(data => {
                if (!data) {
                  res.status(404).send({ message: `Cannot update user with ID: ${phone}. User not found.` });
                } else {
                  
                  res.render('user/user_login',{message:"Successfully updated password"});
                }
              })
              .catch(err => {
                res.status(500).send({ message: "Error updating user information" });
              });
          }
        });
      })
      
    } else {
      // If the verification fails, return an error message
      res.render('forgot-password', { message: "Invalid verification code" });
    }
  } catch (err) {
    res.status(500).send({ message: err.message || "Some error occurred while verifying the code" });
}

};

exports.otp_for_signup = async (req, res, next) => {
  const { phone, referralCode } = req.body;
  req.session.signupDetails = req.body;
  req.session.phone = phone;

  try {
    if (referralCode) {
      // Check if referralCode exists in the database
      const user = await userSchema.findOne({ phone: referralCode });

      if (!user) {
        // Referral code does not match any existing user
        return res.status(400).send("Invalid referral code!");
      }

      // Referral code is valid, proceed with updating wallet balance
      const wallet = await Wallet.findOne({ userId: user._id });

      if (!wallet) {
        // Wallet not found for the user, create a new wallet
        const newWallet = new Wallet({
          userId: user._id,
          balance: 100, // Set initial balance to 100 rupees
          usedAmount :0
        });

        await newWallet.save();
      } else {
        // Wallet found, add 100 rupees to the balance
        wallet.balance += 100;
        
        await wallet.save();
      }
    }

    const otpResponse = await client.verify.v2.services(serviceSid).verifications.create({
      to: "+91" + phone,
      channel: "sms",
    });

    res.render("user/otp_for_signup");
  } catch (error) {
    res.status(error?.status || 400).send(error?.message || "Something went wrong!");
  }
};


// exports.otp_for_signup = async (req, res, next) => {
//   const { phone ,referralCode  } = req.body;
//   req.session.signupDetails=req.body
//   req.session.phone=phone
//   try {

//     // Check if referralCode exists in the database
//     const user = await userSchema.findOne({ phone: referralCode });

//     if (!user) {
//       // Referral code does not match any existing user
//       return res.status(400).send("Invalid referral code!");
//     }

//     // Referral code is valid, proceed with updating wallet balance
//     const wallet = await Wallet.findOne({ userId: user._id });
    
//     if (!wallet) {
//       // Wallet not found for the user, create a new wallet
//       const newWallet = new Wallet({
//         userId: user._id,
//         balance: 100, // Set initial balance to 100 rupees
//       });
      
//       await newWallet.save();
//     } else {
//       // Wallet found, add 100 rupees to the balance
//       wallet.balance += 100;
//       await wallet.save();
//     }


//     const otpResponse = await client.verify.v2
//       .services(serviceSid)
//       .verifications.create({
//         to: "+91"+phone,
//         channel: "sms",
//       });
//      res.render('user/otp_for_signup')
//   } catch (error) {
//     res.status(error?.status || 400).send(error?.message || "Something went wrong!");
//   }

  
// };
  

exports.verify_signup_otp = async (req, res) => {
  const verificationCode =req.body.otp;
  const phoneNumber = req.session.phone;
  const details= req.session.signupDetails
  console.log(details)
  const password=details.password;
  

  if (!phoneNumber) {
    res.status(400).send({ message: "Phone number is required" });
    return;
  }

  try {
    // Verify the SMS code entered by the user
    const verification_check = await client.verify.v2.services(serviceSid).verificationChecks.create({ to: '+91' + phoneNumber, code: verificationCode });

    if (verification_check.status === 'approved') {

      
  const saltRounds = 10;
  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
      res.status(500).send({
        message: err.message || "some error occured while hashing the password",
      });
      return;
    }
    const user = new userSchema({
      name: details.name,
      email:details.email,
      phone: phoneNumber,
      password: hash,
    });
    user
      .save()
      .then(() => {
        req.session.phone = undefined;
        req.session.signupDetails = undefined;
     
      
        res.render("user/user_login_page" ,{message :"User created successfully"});
      })
      .catch((err) => {
        res.json({ message: err.message, type: "danger" });
      });
  });
    } else {
    
      res.render('user/otp_for_signup',{message :"Incorrect OTP please re-enter OTP"})
    }
  } catch (err) {
    
    res.render('user/otp_for_signup',{message :"Incorrect OTP please re-enter OTP"})
}

};
