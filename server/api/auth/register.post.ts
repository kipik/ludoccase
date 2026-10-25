import { defineEventHandler, readBody, createError } from 'h3';
import { getStrapiBaseUrl, getStrapiAdminHeaders } from '../../utils/strapi';

export default defineEventHandler(async (event) => {
  const strapiUrl = getStrapiBaseUrl();
  const body = await readBody(event);

  const { username, email, password, city, postal_code } = body;

  try {
    const data: any = await $fetch(`${strapiUrl}/api/auth/local/register`, {
      method: 'POST',
      body: { username, email, password },
    });

    if (data?.user && data?.jwt) {
      try {
        const createdRes: any = await $fetch(`${strapiUrl}/api/seller-profiles`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${data.jwt}`,
            'Content-Type': 'application/json',
          },
          body: {
            data: {
              user: data.user.id,
              display_name: username,
              city: city || null,
              postal_code: postal_code || null,
              is_cwowd_member: false,
            },
          },
        }).catch(() =>
          $fetch(`${strapiUrl}/api/seller-profiles`, {
            method: 'POST',
            headers: getStrapiAdminHeaders(data.jwt),
            body: {
              data: {
                user: data.user.id,
                display_name: username,
                city: city || null,
                postal_code: postal_code || null,
                is_cwowd_member: false,
              },
            },
          })
        );
        data.user.sellerProfile = createdRes?.data || null;
      } catch (profileErr) {
        console.warn('[Register] Impossible de créer seller-profile:', profileErr);
      }
    }

    return data;
  } catch (error: any) {
    throw createError({
      statusCode: error.response?.status || 400,
      statusMessage: error.response?._data?.error?.message || 'Erreur lors de la création du compte',
    });
  }
});
