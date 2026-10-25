import crypto from 'node:crypto';
import querystring from 'node:querystring';
import { defineEventHandler, getQuery, createError, getCookie, deleteCookie, setCookie, sendRedirect } from 'h3';
import { getStrapiBaseUrl } from '../../../utils/strapi';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const sso = query.sso as string;
  const sig = query.sig as string;
  const config = useRuntimeConfig();

  if (!sso || !sig) {
    throw createError({ statusCode: 400, statusMessage: 'Paramètres sso ou sig manquants' });
  }

  const ssoSecret = config.discourseSsoSecret;
  if (!ssoSecret) {
    throw createError({ statusCode: 500, statusMessage: 'Configuration SSO invalide' });
  }

  const expectedSig = crypto.createHmac('sha256', ssoSecret).update(sso).digest('hex');
  if (expectedSig !== sig) {
    throw createError({ statusCode: 401, statusMessage: 'Signature SSO invalide' });
  }

  const decodedSso = Buffer.from(sso, 'base64').toString('utf-8');
  const payload = querystring.parse(decodedSso);

  const savedNonce = getCookie(event, 'discourse_sso_nonce');
  if (!savedNonce || savedNonce !== payload.nonce) {
    throw createError({ statusCode: 401, statusMessage: 'Nonce SSO invalide ou expiré' });
  }

  deleteCookie(event, 'discourse_sso_nonce');

  const email = payload.email as string;
  const username = payload.username as string;
  const externalId = payload.external_id as string;

  if (!email) {
    throw createError({ statusCode: 400, statusMessage: 'Email manquant dans la réponse Discourse' });
  }

  const strapiInternalUrl = getStrapiBaseUrl();
  const internalKey = config.internalNuxtApiKey;

  if (!internalKey) {
    throw createError({ statusCode: 500, statusMessage: 'INTERNAL_NUXT_API_KEY manquante' });
  }

  try {
    const strapiRes = await $fetch<{ jwt: string; user: any }>(`${strapiInternalUrl}/api/auth-internal/discourse-login`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${internalKey}`,
        'Content-Type': 'application/json',
      },
      body: { email, username, externalId },
    });

    if (strapiRes?.jwt) {
      setCookie(event, 'strapi_jwt', strapiRes.jwt, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
        sameSite: 'lax',
      });

      return sendRedirect(event, '/');
    }

    throw new Error('Réponse invalide de Strapi');
  } catch (error: any) {
    console.error('[SSO Callback Error]', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur de connexion SSO avec Strapi',
    });
  }
});
