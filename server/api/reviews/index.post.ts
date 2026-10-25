import { defineEventHandler, readBody, createError } from 'h3';
import { requireAuthUser, getStrapiBaseUrl, ensureSellerProfile } from '../../utils/strapi';

export default defineEventHandler(async (event) => {
  const { user, token } = await requireAuthUser(event);
  const body = await readBody(event);

  const { conversationDocumentId, rating, comment } = body;

  if (!conversationDocumentId || !rating || Number(rating) < 1 || Number(rating) > 5) {
    throw createError({ statusCode: 400, statusMessage: 'Note entre 1 et 5 requise' });
  }

  const strapiUrl = getStrapiBaseUrl();
  const userHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const convRes: any = await $fetch(`${strapiUrl}/api/marketplace-conversations/${conversationDocumentId}`, {
    headers: userHeaders,
    query: {
      'populate[0]': 'buyer',
      'populate[1]': 'seller',
    },
  }).catch(() => null);

  const conversation = convRes?.data;
  if (!conversation) {
    throw createError({ statusCode: 404, statusMessage: 'Conversation introuvable' });
  }

  const isBuyer = conversation.buyer?.id === user.id;
  const isSeller = conversation.seller?.id === user.id;

  if (!isBuyer && !isSeller) {
    throw createError({ statusCode: 403, statusMessage: 'Non autorisé' });
  }

  if (isBuyer && conversation.buyer_reviewed) {
    throw createError({ statusCode: 400, statusMessage: 'Vous avez déjà évalué cette transaction' });
  }
  if (isSeller && conversation.seller_reviewed) {
    throw createError({ statusCode: 400, statusMessage: 'Vous avez déjà évalué cette transaction' });
  }

  const targetUser = isBuyer ? conversation.seller : conversation.buyer;
  const role = isBuyer ? 'buyer_reviewing_seller' : 'seller_reviewing_buyer';

  // 1. Créer l'avis
  const reviewRes: any = await $fetch(`${strapiUrl}/api/marketplace-reviews`, {
    method: 'POST',
    headers: userHeaders,
    body: {
      data: {
        reviewer: user.id,
        target_user: targetUser.id,
        conversation: conversationDocumentId,
        role,
        rating: Number(rating),
        comment: (comment || '').trim(),
      },
    },
  });

  // 2. Marquer la conversation comme évaluée par ce participant
  await $fetch(`${strapiUrl}/api/marketplace-conversations/${conversationDocumentId}`, {
    method: 'PUT',
    headers: userHeaders,
    body: {
      data: isBuyer ? { buyer_reviewed: true } : { seller_reviewed: true },
    },
  });

  // 3. Recalculer la moyenne d'évaluation du destinataire dans son seller-profile
  try {
    const targetProfile = await ensureSellerProfile(targetUser, token);
    const allReviewsRes: any = await $fetch(`${strapiUrl}/api/marketplace-reviews`, {
      headers: userHeaders,
      query: {
        'filters[target_user][id][$eq]': targetUser.id,
        'pagination[limit]': 500,
      },
    });
    const allReviews = allReviewsRes?.data || [];
    const count = allReviews.length;
    const avg = count > 0
      ? Number((allReviews.reduce((sum: number, r: any) => sum + Number(r.rating || 5), 0) / count).toFixed(2))
      : 5;

    if (targetProfile) {
      await $fetch(`${strapiUrl}/api/seller-profiles/${targetProfile.documentId}`, {
        method: 'PUT',
        headers: userHeaders,
        body: {
          data: {
            rating_average: avg,
            rating_count: count,
            sales_count: isBuyer ? (targetProfile.sales_count || 0) + 1 : targetProfile.sales_count || 0,
          },
        },
      });
    }
  } catch (e) {
    console.warn('[Review Stats Update] Non bloquant:', e);
  }

  return reviewRes?.data;
});
