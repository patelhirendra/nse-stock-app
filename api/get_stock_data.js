export default async function handler(req, res) {
    const { ticker } = req.query;
    if (!ticker) return res.status(400).json({ error: "No ticker provided" });

    const symbol = ticker.toUpperCase().replace(".NS", "").trim();

    // 🔴 PASTE YOUR DAILY GROWW ACCESS TOKEN HERE
    const ACCESS_TOKEN = "eyJhbGciOiJIUzUxMiJ9..."; 

    try {
        const quoteReq = await fetch(`https://api.groww.in/v1/live-data/quote?exchange=NSE&segment=CASH&trading_symbol=${symbol}`, {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "Authorization": `Bearer ${ACCESS_TOKEN}`,
                "X-API-VERSION": "1.0"
            }
        });

        if (!quoteReq.ok) {
            return res.status(quoteReq.status).json({ 
                error: `Groww returned ${quoteReq.status}. If 401, your daily token expired or IP is restricted.` 
            });
        }

        const quoteData = await quoteReq.json();
        const data = quoteData.payload;

        return res.status(200).json({
            ticker: symbol,
            previous_close: data.close, 
            open_price: data.open,
            current_price: data.last_price || data.average_price, 
            upper_circuit: data.upper_circuit_limit,
            lower_circuit: data.lower_circuit_limit
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
