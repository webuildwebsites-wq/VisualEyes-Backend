import crypto from 'crypto';

const EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

export const encodeUidb36 = (mongoId) =>
  BigInt(`0x${mongoId.toString()}`).toString(36);

export const decodeUidb36 = (uidb36) => {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
  let result = 0n;
  for (const c of uidb36.toLowerCase()) {
    result = result * 36n + BigInt(chars.indexOf(c));
  }
  return result.toString(16).padStart(24, '0');
};


export const generateResetToken = (userId, passwordHash) => {
  const uidb36 = encodeUidb36(userId.toString());
  const ts = Buffer.from(Date.now().toString()).toString('base64url');
  const key = `${process.env.JWT_SECRET}${passwordHash}`;
  const hmac = crypto.createHmac('sha256', key).update(`${uidb36}${ts}`).digest('base64url');
  return { uidb36, token: `${ts}-${hmac}` };
};


export const verifyResetToken = (uidb36, token, passwordHash) => {
  try {
    const dashIndex = token.indexOf('-');
    if (dashIndex === -1) return { valid: false, expired: false };

    const ts   = token.slice(0, dashIndex);
    const hmac = token.slice(dashIndex + 1);

    if (!ts || !hmac) return { valid: false, expired: false };

    const issuedAt = parseInt(Buffer.from(ts, 'base64url').toString(), 10);
    if (isNaN(issuedAt) || Date.now() - issuedAt > EXPIRY_MS) {
      return { valid: false, expired: true };
    }

    const key = `${process.env.JWT_SECRET}${passwordHash}`;
    const expected = crypto.createHmac('sha256', key).update(`${uidb36}${ts}`).digest('base64url');

    const hmacBuf     = Buffer.from(hmac);
    const expectedBuf = Buffer.from(expected);
    if (hmacBuf.length !== expectedBuf.length) return { valid: false, expired: false };

    const valid = crypto.timingSafeEqual(hmacBuf, expectedBuf);

    return { valid, expired: false };
  } catch (err) {
    console.error('[ResetToken] exception:', err.message);
    return { valid: false, expired: false };
  }
};
