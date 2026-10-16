export default async function handler(req, res) {
    const { ticker } = req.query;
    if (!ticker) return res.status(400).json({ error: "No ticker provided" });

    const symbol = ticker.toUpperCase().replace(".NS", "").trim();

    try {
        const headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json",
            "Accept-Language": "en-US,en;q=0.9"
        };

        // We use a free proxy to bypass the NSE cloud-firewall WAF block
        const proxyUrl = 'https://corsproxy.io/?';
        
        // 1. Get session cookies via proxy
        const sessionUrl = proxyUrl + encodeURIComponent("https://www.nseindia.com");
        const sessionResponse = await fetch(sessionUrl, { headers });
        const cookies = sessionResponse.headers.get('set-cookie') || '';

        // 2. Fetch the actual data via proxy
        const apiUrl = proxyUrl + encodeURIComponent(`https://www.nseindia.com/api/quote-equity?symbol=${symbol}`);
        const apiResponse = await fetch(apiUrl, {
            headers: { ...headers, "Cookie": cookies }
        });

        if (!apiResponse.ok) {
            return res.status(404).json({ error: `NSE Firewall blocked the request. Try again in a few minutes.` });
        }

        const data = await apiResponse.json();
        const priceInfo = data.priceInfo;

        return res.status(200).json({
            ticker: symbol,
            previous_close: priceInfo.previousClose,
            open_price: priceInfo.open,
            current_price: priceInfo.lastPrice,
            upper_circuit: priceInfo.upperCP,
            lower_circuit: priceInfo.lowerCP
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
