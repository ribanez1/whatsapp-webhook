const express = require('express');
const app = express();

// Middleware to parse JSON
app.use(express.json());

// Your verify token (same as WHATSAPP_VERIFY_TOKEN)
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'your_custom_verify_token_123';

// Webhook verification (GET request)
app.get('/webhook', (req, res) => {
  // Parse params from the webhook verification request
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
  
  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      // Respond with 200 OK and challenge token from the request
      console.log('Webhook verified successfully!');
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

// Webhook to handle incoming messages (POST request)
app.post('/webhook', (req, res) => {
  let body = req.body;

  // Check if this is an event from a WhatsApp Business Account
  if (body.object) {
    if (body.entry && 
        body.entry[0].changes && 
        body.entry[0].changes[0] && 
        body.entry[0].changes[0].value.messages && 
        body.entry[0].changes[0].value.messages[0]
        ) {
      
      let phone_number_id = body.entry[0].changes[0].value.metadata.phone_number_id;
      let from = body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
      let msg_body = body.entry[0].changes[0].value.messages[0].text.body; // extract the message text from the webhook payload
      
      console.log(`Received message from ${from}: ${msg_body}`);
      
      // Here you can process the incoming message
      // For example, send an auto-reply or store in database
      
      // Example: Send a simple reply
      sendMessage(phone_number_id, from, `Echo: ${msg_body}`);
    }
    
    res.status(200).send('EVENT_RECEIVED');
  } else {
    // Return a '404 Not Found' if event is not from a WhatsApp Business Account
    res.sendStatus(404);
  }
});

// Function to send a message back
async function sendMessage(phone_number_id, to, message) {
  const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
  
  const url = `https://graph.facebook.com/v18.0/${phone_number_id}/messages`;
  
  const data = {
    messaging_product: 'whatsapp',
    to: to,
    text: { body: message }
  };
  
  const headers = {
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
  };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    console.log('Message sent:', result);
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server running on port ${PORT}`);
});
