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

    const { MID, key, salt, txnid, amount, productinfo, firstname, email, phone, surl, furl, udf1 } = req.body;

    // PayU test credentials
    const PAYU_MID = MID || '13764891';
    const PAYU_KEY = key || 'SkDGA0';
    const PAYU_SALT = salt || 'q3t0z8uAUX3ZEv4ecMWmjRxmOBwUKqjc';

    try {
        // Generate hash sequence for PayU
        // hashString = key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5|udf6|udf7|udf8|udf9|udf10|salt
        const hashString = `${PAYU_KEY}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1 || ''}|||||||||||${PAYU_SALT}`;
        
        const hash = crypto.createHash('sha512').update(hashString).digest('hex');

        res.status(200).json({
            success: true,
            hash: hash,
            mid: PAYU_MID,
            key: PAYU_KEY
        });

    } catch (error) {
        console.error('Hash generation error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
