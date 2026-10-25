import { defineEventHandler, readBody, createError } from 'h3';
import { requireAuthUser, getStrapiBaseUrl, getStrapiAdminHeaders, ensureSellerProfile } from '../../utils/strapi';

export default defineEventHandler(async (event) => {
  const { user, token } = await requireAuthUser(event);
  const body = await readBody(event);

  const {
    gameDocumentId,
    editionDocumentId,
    price,
    condition_box,
    condition_components,
    language_code,
    description,
    delivery_hand,
    delivery_shipping,
    location_city,
    location_postal_code,
  } = body;

  if (!gameDocumentId || price === undefined || price === null || Number(price) < 0) {
    throw createError({ statusCode: 400, statusMessage: 'Le jeu et un prix valide sont requis' });
  }

  const strapiUrl = getStrapiBaseUrl();
  const userHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // S'assurer que le profil vendeur existe et mettre à jour sa ville par défaut s'il l'a renseignée
  const sellerProfile = await ensureSellerProfile(user, token);
  if (sellerProfile && (location_city || location_postal_code) && !sellerProfile.city) {
    await $fetch(`${strapiUrl}/api/seller-profiles/${sellerProfile.documentId}`, {
      method: 'PUT',
      headers: userHeaders,
      body: {
        data: {
          city: location_city || sellerProfile.city,
          postal_code: location_postal_code || sellerProfile.postal_code,
        },
      },
    }).catch(() => {});
  }

  const payload = {
    data: {
      seller: user.id,
      game: gameDocumentId,
      edition: editionDocumentId || null,
      price: Number(price),
      condition_box: condition_box || 'like_new',
      condition_components: condition_components || 'complete_like_new',
      language_code: language_code || 'VF',
      description: description || '',
      delivery_hand: delivery_hand ?? true,
      delivery_shipping: delivery_shipping ?? true,
      location_city: location_city || sellerProfile?.city || '',
      location_postal_code: location_postal_code || sellerProfile?.postal_code || '',
      status: 'active',
    },
  };

  try {
    const listingRes: any = await $fetch(`${strapiUrl}/api/marketplace-listings`, {
      method: 'POST',
      headers: userHeaders,
      body: payload,
    });
    return listingRes?.data;
  } catch {
    const listingRes: any = await $fetch(`${strapiUrl}/api/marketplace-listings`, {
      method: 'POST',
      headers: getStrapiAdminHeaders(token),
      body: payload,
    });
    return listingRes?.data;
  }
});
