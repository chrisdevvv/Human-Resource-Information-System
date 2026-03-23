const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.id && decoded.iat) {
            const [invalidations] = await pool.promise().query(
                `SELECT invalid_after
                 FROM user_token_invalidations
                 WHERE user_id = ?
                 LIMIT 1`,
                [decoded.id]
            );

            if (invalidations.length > 0) {
                const issuedAtSeconds = Number(decoded.iat);
                const invalidAfterMs = new Date(invalidations[0].invalid_after).getTime();

                if (Number.isFinite(issuedAtSeconds) && Number.isFinite(invalidAfterMs)) {
                    const issuedAtMs = issuedAtSeconds * 1000;
                    if (issuedAtMs <= invalidAfterMs) {
                        return res.status(401).json({ message: 'Session has ended. Please log in again.' });
                    }
                }
            }
        }

        if (decoded.jti) {
            const [rows] = await pool.promise().query(
                `SELECT jti
                 FROM revoked_tokens
                 WHERE jti = ? AND expires_at > NOW()
                 LIMIT 1`,
                [decoded.jti]
            );

            if (rows.length > 0) {
                return res.status(401).json({ message: 'Session has ended. Please log in again.' });
            }
        }

        req.token = token;
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
};

module.exports = authMiddleware;