export default defineNuxtConfig({
  compatibilityDate: '2024-10-05',

  app: {
    head: {
      titleTemplate: '%s — Ludoccase',
      meta: [
        { name: 'description', content: 'Ludoccase — La place de marché 100% gratuite de jeux de société d\'occasion entre passionnés.' }
      ]
    }
  },

  modules: ['@nuxt/icon', '@nuxt/image', '@nuxt/ui'],

  runtimeConfig: {
    // Clés privées serveur
    strapiToken: process.env.STRAPI_TOKEN || '',
    discourseSsoSecret: process.env.DISCOURSE_SSO_SECRET || '',
    internalNuxtApiKey: process.env.INTERNAL_NUXT_API_KEY || '',

    // Configuration Email Transactionnel (Brevo / Amazon SES / SMTP)
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: process.env.SMTP_PORT || '587',
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    smtpFrom: process.env.SMTP_FROM || 'Ludoccase <noreply@ludoccase.fr>',

    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3001',
      strapiUrl: process.env.NUXT_PUBLIC_STRAPI_URL || 'https://api.je-bosse.fr',
      GQL_HOST: (process.env.NUXT_PUBLIC_STRAPI_GRAPHQL_URL || 'https://api.je-bosse.fr/graphql').replace(/\/$/, '').replace(/\/graphql$/, '') + '/graphql',
      forumUrl: process.env.NUXT_PUBLIC_FORUM_URL || 'https://forum.cwowd.com',
      meilisearchHost: process.env.NUXT_PUBLIC_MEILISEARCH_HOST || '',
      meilisearchSearchKey: process.env.NUXT_PUBLIC_MEILISEARCH_SEARCH_KEY || '',
    },
  },

  css: ['~/assets/css/main.css'],

  postcss: {
    plugins: {
      '@tailwindcss/postcss': {},
      autoprefixer: {},
    },
  },

  image: {
    domains: [
      'pub-8d43c93fba3940d5865160edc0390db3.r2.dev',
      new URL(process.env.NUXT_PUBLIC_STRAPI_URL || 'https://api.je-bosse.fr').hostname
    ],
  },
});
