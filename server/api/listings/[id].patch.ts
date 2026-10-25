import { defineEventHandler, getRouterParam, readBody, createError } from 'h3';
import { requireAuthUser, getStrapiBaseUrl } from '../../utils/strapi';

export default defineEventHandler(async (event) => {
  const { user, token } = await requireAuthUser(event);
  const id = getRouterParam(event, 'id');
  const body = await readBody(event);

  const strapiUrl = getStrapiBaseUrl();
  const userHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Vérifier que l'annonce appartient bien au vendeur connecté
  const existingRes: any = await $fetch(`${strapiUrl}/api/marketplace-listings/${id}`, {
    headers: userHeaders,
    query: { 'populate[0]': 'seller' },
  }).catch(() => null);

  const listing = existingRes?.data;
  if (!listing) {
    throw createError({ statusCode: 404, statusMessage: 'Annonce introuvable' });
  }

  if (listing.seller?.id !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Non autorisé à modifier cette annonce' });
  }

  const allowedUpdates: Record<string, any> = {};
  if (body.status) allowedUpdates.status = body.status;
  if (body.price !== undefined) allowedUpdates.price = Number(body.price);
  if (body.description !== undefined) allowedUpdates.description = body.description;
  if (body.condition_box) allowedUpdates.condition_box = body.condition_box;
  if (body.condition_components) allowedUpdates.condition_components = body.condition_components;

  const updatedRes: any = await $fetch(`${strapiUrl}/api/marketplace-listings/${id}`, {
    method: 'PUT',
    headers: userHeaders,
    body: { data: allowedUpdates },
  });

  return updatedRes?.data;
});
