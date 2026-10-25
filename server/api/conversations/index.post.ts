import { defineEventHandler, readBody, createError } from 'h3';
import { requireAuthUser, getStrapiBaseUrl, getStrapiAdminHeaders } from '../../utils/strapi';
import { sendTransactionalEmail } from '../../utils/email';

export default defineEventHandler(async (event) => {
  const { user, token } = await requireAuthUser(event);
  const body = await readBody(event);
  const config = useRuntimeConfig();

  const { sellerId, listingDocumentIds, message, offeredPrice } = body;

  if (!sellerId || !Array.isArray(listingDocumentIds) || listingDocumentIds.length === 0 || !message?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Vendeur, annonce(s) et message requis' });
  }

  if (Number(sellerId) === Number(user.id)) {
    throw createError({ statusCode: 400, statusMessage: 'Vous ne pouvez pas vous contacter vous-même' });
  }

  const strapiUrl = getStrapiBaseUrl();
  const userHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  const nowIso = new Date().toISOString();

  // 1. Créer la conversation
  const convRes: any = await $fetch(`${strapiUrl}/api/marketplace-conversations`, {
    method: 'POST',
    headers: userHeaders,
    body: {
      data: {
        buyer: user.id,
        seller: Number(sellerId),
        listings: listingDocumentIds,
        status: 'open',
        offered_price: offeredPrice ? Number(offeredPrice) : null,
        last_message_preview: message.trim().slice(0, 140),
        last_message_at: nowIso,
        buyer_unread_count: 0,
        seller_unread_count: 1,
      },
    },
  });

  const conversation = convRes?.data;

  // 2. Si c'est un lot (>1 jeu) ou s'il y a une offre de prix, créer un message système récapitulatif + le message de l'acheteur
  if (listingDocumentIds.length > 1 || offeredPrice) {
    const sysText = listingDocumentIds.length > 1
      ? `📦 Demande de lot pour ${listingDocumentIds.length} jeux${offeredPrice ? ` — Offre proposée : ${offeredPrice} €` : ''}`
      : `💬 Offre proposée : ${offeredPrice} €`;

    await $fetch(`${strapiUrl}/api/marketplace-messages`, {
      method: 'POST',
      headers: userHeaders,
      body: {
        data: {
          conversation: conversation.documentId,
          sender: user.id,
          content: sysText,
          is_system: true,
        },
      },
    }).catch(() => {});
  }

  await $fetch(`${strapiUrl}/api/marketplace-messages`, {
    method: 'POST',
    headers: userHeaders,
    body: {
      data: {
        conversation: conversation.documentId,
        sender: user.id,
        content: message.trim(),
        is_system: false,
      },
    },
  });

  // 3. Envoyer un email transactionnel au vendeur
  try {
    const sellerUser: any = await $fetch(`${strapiUrl}/api/users/${sellerId}`, {
      headers: getStrapiAdminHeaders(token),
    }).catch(() => null);
    if (sellerUser?.email) {
      const convUrl = `${config.public.siteUrl}/messages/${conversation.documentId}`;
      await sendTransactionalEmail({
        to: sellerUser.email,
        subject: `🎲 Nouveau message de ${user.username} sur Ludoccase`,
        text: `Bonjour ${sellerUser.username},\n\n${user.username} vous a envoyé un message concernant vos jeux en vente sur Ludoccase :\n\n"${message.trim()}"\n\nRépondez-lui directement sur :\n${convUrl}\n\nBon jeu,\nL'équipe Ludoccase`,
      });
    }
  } catch (e) {
    console.warn('[Conversation Email] Non bloquant:', e);
  }

  return conversation;
});
