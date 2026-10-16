export default async function handler(req, res) {
    const { ticker } = req.query;
    
    if (!ticker) {
        return res.status(400).json({ error: "No ticker provided" });
    }

    const symbol = ticker.toUpperCase().replace(".NS", "").trim();

    try {
        const headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5"
        };

        // 1. Visit NSE homepage to get fresh cookies
        const sessionResponse = await fetch("https://www.nseindia.com", { headers });
        const cookies = sessionResponse.headers.get('set-cookie') || '';

        // 2. Fetch the quote data
        const apiResponse = await fetch(`https://www.nseindia.com/api/quote-equity?symbol=${encodeURIComponent(symbol)}`, {
            headers: { 
                ...headers, 
                "Cookie": cookies 
            }
        });

        if (!apiResponse.ok) {
            return res.status(404).json({ error: `Stock symbol '${symbol}' not found on NSE or connection timed out.` });
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
