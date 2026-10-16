import crypto from 'crypto';

export default async function handler(req, res) {
    const { ticker } = req.query;
    if (!ticker) return res.status(400).json({ error: "No ticker provided" });

    const symbol = ticker.toUpperCase().replace(".NS", "").trim();

    // 🔴 PASTE YOUR GROWW CREDENTIALS HERE
    const API_KEY = "eyJraWQiOi..."; // Your Groww API Key
    const API_SECRET = "LMI-1aRy..."; // Your Groww API Secret

    try {
        // 1. Generate Checksum to mathematically prove your identity
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const hash = crypto.createHash('sha256').update(API_SECRET + timestamp).digest('hex');

        // 2. Ask Groww for a secure Access Token
        const tokenReq = await fetch("https://api.groww.in/v1/token/api/access", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                key_type: "approval",
                checksum: hash,
                timestamp: timestamp
            })
        });

        const tokenData = await tokenReq.json();
        
        // Extract the token (Groww places it either at the root or inside 'payload')
        const accessToken = tokenData.access_token || (tokenData.payload && tokenData.payload.access_token);

        if (!accessToken) {
            return res.status(401).json({ 
                error: "Groww Auth Failed: Ensure your credentials are correct and you clicked 'Approve' on the Groww API Dashboard today." 
            });
        }

        // 3. Fetch Live Quote Data (Price, Circuits, OHLC)
        const quoteReq = await fetch(`https://api.groww.in/v1/live-data/quote?exchange=NSE&segment=CASH&trading_symbol=${symbol}`, {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "Authorization": `Bearer ${accessToken}`,
                "X-API-VERSION": "1.0"
            }
        });

        if (!quoteReq.ok) {
            return res.status(404).json({ error: `Stock symbol '${symbol}' not found on Groww.` });
        }

        const quoteData = await quoteReq.json();
        const data = quoteData.payload;

        // 4. Send exact numbers back to our HTML frontend
        return res.status(200).json({
            ticker: symbol,
            previous_close: data.close, 
            open_price: data.open,
            current_price: data.last_price || data.average_price, 
            upper_circuit: data.upper_circuit_limit,
            lower_circuit: data.lower_circuit_limit
        });

    } catch (error) {
        return res.status(500).json({ error: "Serverless execution failed: " + error.message });
    }
}
