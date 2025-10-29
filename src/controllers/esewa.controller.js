import crypto from 'crypto'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import Order from '../Models/order.model.js'
import Pet from '../Models/pet.model.js'
import Accessory from '../Models/accessories.model.js'

const ESEWA_PRODUCT_CODE = 'EPAYTEST';
const ESEWA_SECRET = '8gBm/:&EnhH.1/q';
const FRONTEND_URL='http://localhost:5174';
const BACKEND_URL='http://localhost:5001';


// helper to build signature (fields order MUST match signed_field_names)
// function buildHmacSignature(secret, message) {
//     return crypto.createHmac('sha256', secret).update(message).digest('base64');
// }

/**
 * POST /api/payments/esewa/initiate
 * body: { orderId }
 * returns: { action, params } where `action` is eSewa form url and `params` is object of fields to post
 */

export const initiateEsewa = async (req, res) => {
    try {
        const { orderId } = req.body;
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        //build transaction uuid(unique per attempt)
        const transaction_uuid = `${order._id}-${Date.now()}`; // or uuidv4()

        //amounts
        const amount = Number(order.totalAmount).toFixed(2);
        const tax_amount = "0";
        const product_service_charge = "0";
        const product_delivery_charge = "0";
//         const total_amount = 
//   Number(amount) + 
//   Number(tax_amount) + 
//   Number(product_service_charge) + 
//   Number(product_delivery_charge);

const total_amount=Number(amount).toFixed(2);

//   const total_amount_str = total_amount.toFixed(2);
        // signed fields (server expects this specific order for signature)
        const signed_field_names = "total_amount,transaction_uuid,product_code";
const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${ESEWA_PRODUCT_CODE}`;

        const signature = crypto
      .createHmac("sha256", ESEWA_SECRET)
      .update(message)
      .digest("base64");

        // persist transaction_uuid with the order so we can match callback
        order.esewa = {
            transaction_uuid,
            status: 'initiated',
        };
        await order.save();

        //choose endpoint
        // const uatAction = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form'; //example test form url



        // return res.json({
        //     uatAction,
        //     params: {
        //         amount: String(amount),
        //         tax_amount: String(tax_amount),
        //         total_amount: String(total_amount),
        //         transaction_uuid,
        //         product_code: ESEWA_PRODUCT_CODE,
        //         product_service_charge: String(product_service_charge),
        //         product_delivery_charge: String(product_delivery_charge),
        //         success_url: `${BACKEND_URL}/api/payments/esewa/complete`, // server endpoint to verify
        //         failure_url: `${BACKEND_URL}/api/payments/esewa/failed`,
        //         signed_field_names,
        //         signature,
        //     },
        // });

        return res.json({
  uatAction: "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
  params: {
    amount,
    tax_amount,
    total_amount,
    transaction_uuid,
    product_code: ESEWA_PRODUCT_CODE,
    product_service_charge: "0",
    product_delivery_charge: "0",
    success_url: `${BACKEND_URL}/api/payment/esewa/complete`,
    failure_url: `${BACKEND_URL}/api/payment/esewa/failed`,
    signed_field_names,
    signature,
  },
});


        
    }
    catch (err) {
        console.error('initiateEsewa error', err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * POST/GET /api/payments/esewa/complete
 * eSewa will redirect customer to this URL with a base64 encoded JSON payload.
 * We'll decode, verify signature, call status-check API and update the order.
 */

export const esewaComplete=async(req,res)=>{
    try{
        // eSewa may send the encoded payload as query param (common) or POST body.
        const encoded=req.query.data || req.query.encodedData ||req.body.data || req.body.encodedData;
        if(!encoded) return res.status(400).send("Missing encoded payload")
        const decodedJson=Buffer.from(encoded,'base64').toString('utf-8');  
    const payload=JSON.parse(decodedJson);
    
    // payload contains fields like: transaction_code, status, total_amount, transaction_uuid, product_code, signature, signed_field_names
    const { transaction_uuid, total_amount, product_code, signature, signed_field_names } = payload;

    //rebuild message from signed_field_names order and verify signature
    const fieldOrder=(signed_field_names || '').split(',').map(f=>f.trim()).filter(Boolean);
    const messageParts = fieldOrder.map(f => `${f}=${payload[f]}`);
    const message=messageParts.join(',');
    const expectedSig = crypto.createHmac("sha256", ESEWA_SECRET).update(message).digest("base64");
    if(expectedSig!==signature){
        console.warn('esewa signature mismatch',{expectedSig,signature, message,payload});
        return res.status(400).send('Signature mismatch');
    }
    //call status check api for final verification

    const statusBase='https://rc-epay.esewa.com.np';
    const statusUrl = `${statusBase}/api/epay/transaction/status/?product_code=${encodeURIComponent(product_code)}&total_amount=${encodeURIComponent(total_amount)}&transaction_uuid=${encodeURIComponent(transaction_uuid)}&transaction_code=${encodeURIComponent(payload.transaction_code)}`;
    const statusRes = await axios.get(statusUrl, { timeout: 10000 });
    const statusData = statusRes.data;
    // find order by saved transaction_uuid and update
    const order = await Order.findOne({ 'esewa.transaction_uuid': transaction_uuid });
    if (!order) {
      console.warn('order not found for transaction_uuid', transaction_uuid);
      // optionally create a record or return user-friendly page
      return res.status(404).send('Order not found');
    }
    order.paymentStatus="Paid"
    order.orderStatus = 'verified'; // choose your status alias
    order.esewa.status = 'complete';
    //deduct stock only after payment is verififed
    for (const a of order.orderItems) {
      
      
  if (a.itemType === "Pet") {
    await Pet.findByIdAndUpdate(a.item, { $inc: { quantityInStock: -a.quantity } });
    const i=await Pet.findById(a.item);
    if(i.quantityInStock<=0){
      i.availability=false;
    }
    await i.save();
  } else if (a.itemType === "Accessory") {
    await Accessory.findByIdAndUpdate(a.item, { $inc: { quantityInStock: -a.quantity } });
    const i=await Accessory.findById(a.item);
    if(i.quantityInStock<=0){
      i.inStock=false;
    }
    await i.save()
  }
}


    order.esewa.ref_id = statusData.refId || statusData.ref_id || null;
    await order.save();

    // redirect to your frontend success page
    return res.redirect(`${FRONTEND_URL}/payment-success?orderId=${order._id}`);
    
    }
    catch(err){
        console.error('esewaComplete error', err?.response?.data || err.message || err);
        return res.status(500).send('Server error while verifying payment');
    }
}
/** Optional: failure route */
export const esewaFailed = async (req, res) => {
  // handle failure redirect (mark order failed or show message)
  // eSewa might redirect here with encoded data too
  return res.send('Payment failed or cancelled');
};

