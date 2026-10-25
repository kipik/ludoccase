import { defineEventHandler, readBody, createError } from 'h3';
import { getStrapiBaseUrl, ensureSellerProfile } from '../../utils/strapi';

export default defineEventHandler(async (event) => {
  const strapiUrl = getStrapiBaseUrl();
  const body = await readBody(event);

  try {
    const data: any = await $fetch(`${strapiUrl}/api/auth/local`, {
      method: 'POST',
      body,
    });

    if (data?.user && data?.jwt) {
      const sellerProfile = await ensureSellerProfile(data.user, data.jwt).catch(() => null);
      data.user.sellerProfile = sellerProfile;
    }

    return data;
  } catch (error: any) {
    throw createError({
      statusCode: error.response?.status || 400,
      statusMessage: error.response?._data?.error?.message || 'Identifiants invalides',
    });
  }
});
