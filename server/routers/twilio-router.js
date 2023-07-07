const express=require('express')
require('dotenv').config()
const twilio_sms = require('../controller/twilio_sms')


const router =express.Router();

router.post('/send_password_OTP',twilio_sms.send_password_OTP)
router.post('/verify_password_OTP',twilio_sms.verify_password_OTP)

router.post('/add_user_signup',twilio_sms.otp_for_signup)
router.post('/otp_for_signup',twilio_sms.verify_signup_otp)


module.exports=router;
