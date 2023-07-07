let paypalTotal = 0
exports.checkout = async (req, res) => {
  const user = req.session.user;
  if (user) {
    try {
      const id = req.params.id;
      const userId = req.session.user?._id;
      const payment = req.body.payment;
      const Currentuser = await userSchema.findOne({ _id: userId });
      if (!Currentuser) {
        return res.status(404).send('User not found');
      }
    const addressIndex = Currentuser.address.findIndex((item)=> item._id.equals(id))

    const specifiedAddress = Currentuser.address[addressIndex]

      if (!specifiedAddress) {
        return res.status(404).send('Address not found');
      }

      const cart = await cartSchema
        .findOne({ userId: userId })
        .populate("products.productId");

      cart ? console.log(cart) : console.log("Cart not found");

      const discount = cart.total

      const items = cart.products.map((item) => {
        const product = item.productId;
        const quantity = item.quantity;
        const price = product.price;


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
      if (payment == "cod") {
        const order = new orderSchema({
          user: userId,
          items: items,
          total: totalPrice,
          status: "Pending",
          payment_method: payment,
          createdAt: new Date(),
          address: specifiedAddress,
        });
        await order.save();
  
        await cartSchema.deleteOne({ userId: userId });
  
        res.render("user/order_confirm", {user,userId});

      } else if (payment == "paypal") {
        const order = new orderSchema({
          user: userId,
          items: items,
          total: totalPrice,
          status: "Pending",
          payment_method: payment,
          createdAt: new Date(),
          address: specifiedAddress,
        })
        await order.save()

        cart.products.forEach((element) => {
          paypalTotal += totalPrice
        })

        let createPayment = {
          intent: "sale",
          payer: { payment_method: "paypal" },
          redirect_urls: {
            return_url: "http://localhost:8080/paypal-success",
            cancel_url: "http://localhost:8080/paypal-err",
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
        
      }
      
    } catch (error) {
      console.log(error);
      res.status(500).send("Checkout failed!");
    }
  } else {
    res.redirect("/login")
  }
};

exports.paypal_success = async (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;
  const user = req.session.user;
  const userId = req.session.user?._id;

  const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [{
      "amount": {
        "currency": "USD",
        "total": paypalTotal
      }
    }]
  };

  paypal.payment.execute(paymentId, execute_payment_json, function(error, payment) {
    if (error) {
      if (error.response && error.response.name === 'PAYER_ACTION_REQUIRED') {
        // Redirect the buyer to the PayPal resolution link
        const resolutionLink = error.response.links.find(link => link.rel === 'https://uri.paypal.com/rel/resolution');
        if (resolutionLink) {
          res.redirect(resolutionLink.href);
        } else {
          // Handle the case when resolution link is not available
          console.log('Resolution link not found.');
          throw error;
        }
      } else {
        console.log(error);
        throw error;
      }
    } else {
      console.log(JSON.stringify(payment));
      res.render("user/paypal_success", { payment, user, userId });
    }
  });
};
