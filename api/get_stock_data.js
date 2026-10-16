import crypto from 'crypto';

export default async function handler(req, res) {
    const { ticker } = req.query;
    if (!ticker) return res.status(400).json({ error: "No ticker provided" });

    const symbol = ticker.toUpperCase().replace(".NS", "").trim();

    // 🔴 PASTE YOUR GROWW CREDENTIALS HERE
    const API_KEY = "eyJraWQiOiJaTUtjVXciLCJhbGciOiJFUzI1NiJ9.eyJleHAiOjI1ODA1NjkwOTgsImlhdCI6MTc5MjE2OTA5OCwibmJmIjoxNzkyMTY5MDk4LCJzdWIiOiJ7XCJ0b2tlblJlZklkXCI6XCJkNTM5OGY4ZS01MDM0LTQ0YjYtOWZkMS01MWE5MzM3ZGY3YjJcIixcInZlbmRvckludGVncmF0aW9uS2V5XCI6XCJlMzFmZjIzYjA4NmI0MDZjODg3NGIyZjZkODQ5NTMxM1wiLFwidXNlckFjY291bnRJZFwiOlwiMDg1YTMwMTAtYTdiZC00ZDAxLThhODAtZGYyNTM1OWVhYjgxXCIsXCJkZXZpY2VJZFwiOlwiNTEwNmQ4NzgtNTI4YS01NDNmLWE1OTMtOTkwZTRkYjU3MDBkXCIsXCJzZXNzaW9uSWRcIjpcImE2N2M1ZWUyLWYxM2EtNDlmNi04ZGI0LTM2N2YzMzY3MWQ3M1wiLFwiYWRkaXRpb25hbERhdGFcIjpcIno1NC9NZzltdjE2WXdmb0gvS0EwYkpMTUlra25JdlZZckh5OGdjbHVaMVpSTkczdTlLa2pWZDNoWjU1ZStNZERhWXBOVi9UOUxIRmtQejFFQisybTdRPT1cIixcInJvbGVcIjpcImF1dGgtdG90cFwiLFwic291cmNlSXBBZGRyZXNzXCI6XCIyNDA5OjQwYzQ6MjFjZTozYzkyOjhkYjQ6M2M5OmNiYjQ6MzU3MSwxNzIuNzAuMjE5LjY1LDM1LjI0MS4yMy4xMjNcIixcInR3b0ZhRXhwaXJ5VHNcIjoyNTgwNTY5MDk4NjU4LFwidmVuZG9yTmFtZVwiOlwiZ3Jvd3dBcGlcIn0iLCJpc3MiOiJhcGV4LWF1dGgtcHJvZC1hcHAifQ.vnP4q_paSOb1rCNLfBfDk-mxuIRlOiZV4ARK9dkiCPq3pllS82KJukQybCEaquZOqeT7LabKE8NsumhLFZ8Yxw"; // Your Groww API Key
    const API_SECRET = "E_-e_YpAdFrIf2^uLOk8uDdQsS(@3-xq"; // Your Groww API Secret

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
