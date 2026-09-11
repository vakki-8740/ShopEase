const crypto = require('crypto');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { salt, key, status, txnid, amount, productinfo, firstname, email, hash } = req.body;

    const PAYU_SALT = salt || 'q3t0z8uAUX3ZEv4ecMWmjRxmOBwUKqjc';
    const PAYU_KEY = key || 'SkDGA0';

    try {
        // Verify hash - PayU verification hash format
        // salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
        const hashString = `${PAYU_SALT}|${status}||||||${''}|${''}|${''}|${''}|${''}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${PAYU_KEY}`;
        
        const calculatedHash = crypto.createHash('sha512').update(hashString).digest('hex');

        if (calculatedHash === hash) {
            res.status(200).json({
                success: true,
                verified: true,
                status: status,
                txnid: txnid
            });
        } else {
            res.status(200).json({
                success: true,
                verified: false,
                status: status,
                txnid: txnid
            });
        }

    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
