export default async function handler(req: any, res: any) {
  // 1. Handle Webhook Verification (GET)
  if (req.method === 'GET') {
    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'hirenest_secure_token';
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WhatsApp Webhook Verified');
      return res.status(200).send(challenge);
    }
    return res.status(403).json({ error: 'Verification failed' });
  }

  // 2. Handle Incoming Messages (POST)
  if (req.method === 'POST') {
    try {
      const body = req.body;
      
      // Log for production debugging
      console.log('WhatsApp Webhook Received:', JSON.stringify(body, null, 2));

      // Extract message content
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const message = value?.messages?.[0];

      if (message) {
        const from = message.from; // Sender phone number
        const text = message.text?.body; // Message text
        const messageId = message.id;

        // STRATEGIC ACTION:
        // Here we would:
        // 1. Check processing_cache for messageId (deduplication)
        // 2. Map 'from' to a Client or Candidate in Supabase
        // 3. Call Gemini AI to Generate Reply
        // 4. Send reply back via Meta Graph API
        
        console.log(`Processing message from ${from}: ${text}`);
      }

      return res.status(200).json({ status: 'success' });
    } catch (error) {
      console.error('Webhook Error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
