import { defineEventHandler, readBody } from 'h3';
import { requireAuthUser, getStrapiBaseUrl, getStrapiAdminHeaders, ensureSellerProfile } from '../../utils/strapi';

export default defineEventHandler(async (event) => {
  const { user, token } = await requireAuthUser(event);
  const body = await readBody(event);
  const strapiUrl = getStrapiBaseUrl();

  const profile = await ensureSellerProfile(user, token);
  if (!profile) return null;

  const updateData: Record<string, any> = {};
  if (body.display_name !== undefined) updateData.display_name = body.display_name;
  if (body.bio !== undefined) updateData.bio = body.bio;
  if (body.city !== undefined) updateData.city = body.city;
  if (body.postal_code !== undefined) updateData.postal_code = body.postal_code;
  if (body.lot_discount_info !== undefined) updateData.lot_discount_info = body.lot_discount_info;
  if (body.shipping_methods !== undefined) updateData.shipping_methods = body.shipping_methods;
  if (body.payment_methods !== undefined) updateData.payment_methods = body.payment_methods;

  const updated: any = await $fetch(`${strapiUrl}/api/seller-profiles/${profile.documentId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: { data: updateData },
  }).catch(() =>
    $fetch(`${strapiUrl}/api/seller-profiles/${profile.documentId}`, {
      method: 'PUT',
      headers: getStrapiAdminHeaders(token),
      body: { data: updateData },
    })
  );

  return updated?.data;
});
