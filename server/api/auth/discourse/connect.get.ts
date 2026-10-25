import crypto from 'node:crypto';
import { defineEventHandler, createError, setCookie, getRequestHeader, sendRedirect } from 'h3';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const ssoSecret = config.discourseSsoSecret;
  const forumUrl = config.public.forumUrl;

  if (!ssoSecret) {
    throw createError({ statusCode: 500, statusMessage: 'DISCOURSE_SSO_SECRET non configuré' });
  }

  const nonce = crypto.randomBytes(16).toString('hex');

  setCookie(event, 'discourse_sso_nonce', nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10,
    path: '/',
  });

  const host = getRequestHeader(event, 'x-forwarded-host') || getRequestHeader(event, 'host') || 'localhost:3001';
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const cleanHost = process.env.NODE_ENV === 'production' ? host.split(':')[0] : host;
  const returnUrl = `${protocol}://${cleanHost}/api/auth/discourse/callback`;

  const payloadString = `nonce=${nonce}&return_sso_url=${returnUrl}`;
  const payloadBase64 = Buffer.from(payloadString).toString('base64');
  const sig = crypto.createHmac('sha256', ssoSecret).update(payloadBase64).digest('hex');

  const redirectUrl = `${forumUrl}/session/sso_provider?sso=${encodeURIComponent(payloadBase64)}&sig=${sig}`;
  return sendRedirect(event, redirectUrl);
});
