import { z } from "zod";

export const LOCAL_STORAGE_KEY = 'social_media_api_keys';

// تكوين المنصات
export const platformConfig = {
  facebook: {
    title: "فيسبوك وانستغرام",
    description: "قم بإنشاء تطبيق على Facebook Developers وأدخل المفاتيح هنا",
    fields: {
      appId: {
        name: "appId",
        label: "App ID",
        type: "text",
        placeholder: "أدخل App ID",
      },
      appSecret: {
        name: "appSecret",
        label: "App Secret",
        type: "password",
        placeholder: "أدخل App Secret",
      },
    },
    instructions: [
      "1. قم بزيارة https://developers.facebook.com",
      "2. أنشئ تطبيقًا جديدًا",
      "3. اختر نوع التطبيق 'Business'",
      "4. قم بتفعيل منتجات Facebook Login و Instagram Graph API",
      "5. أضف عنوان OAuth redirect URI: https://your-domain.com/api/auth/facebook/callback",
    ],
  },
  twitter: {
    title: "تويتر",
    description: "قم بإنشاء تطبيق على Twitter Developer Portal وأدخل المفاتيح هنا",
    fields: {
      apiKey: {
        name: "apiKey",
        label: "API Key",
        type: "text",
        placeholder: "أدخل API Key",
      },
      apiSecret: {
        name: "apiSecret",
        label: "API Secret",
        type: "password",
        placeholder: "أدخل API Secret",
      },
    },
    instructions: [
      "1. قم بزيارة https://developer.twitter.com",
      "2. أنشئ مشروعًا جديدًا",
      "3. قم بتفعيل صلاحيات OAuth 2.0",
      "4. أضف عنوان OAuth redirect URI: https://your-domain.com/api/auth/twitter/callback",
    ],
  },
  tiktok: {
    title: "تيك توك",
    description: "قم بإنشاء تطبيق على TikTok for Developers وأدخل المفاتيح هنا",
    fields: {
      clientKey: {
        name: "clientKey",
        label: "Client Key",
        type: "text",
        placeholder: "أدخل Client Key",
      },
      clientSecret: {
        name: "clientSecret",
        label: "Client Secret",
        type: "password",
        placeholder: "أدخل Client Secret",
      },
    },
    instructions: [
      "1. قم بزيارة https://developers.tiktok.com",
      "2. أنشئ تطبيقًا جديدًا",
      "3. قم بتفعيل TikTok Login Kit",
      "4. أضف عنوان OAuth redirect URI: https://your-domain.com/api/auth/tiktok/callback",
    ],
  },
  snapchat: {
    title: "سناب شات",
    description: "قم بإنشاء تطبيق على Snap Kit Developer Portal وأدخل المفاتيح هنا",
    fields: {
      clientId: {
        name: "clientId",
        label: "Client ID",
        type: "text",
        placeholder: "أدخل Client ID",
      },
      clientSecret: {
        name: "clientSecret",
        label: "Client Secret",
        type: "password",
        placeholder: "أدخل Client Secret",
      },
    },
    instructions: [
      "1. قم بزيارة https://kit.snapchat.com",
      "2. أنشئ تطبيقًا جديدًا",
      "3. قم بتفعيل Login Kit",
      "4. أضف عنوان OAuth redirect URI: https://your-domain.com/api/auth/snapchat/callback",
    ],
  },
  linkedin: {
    title: "لينكد إن",
    description: "قم بإنشاء تطبيق على LinkedIn Developers وأدخل المفاتيح هنا",
    fields: {
      clientId: {
        name: "clientId",
        label: "Client ID",
        type: "text",
        placeholder: "أدخل Client ID",
      },
      clientSecret: {
        name: "clientSecret",
        label: "Client Secret",
        type: "password",
        placeholder: "أدخل Client Secret",
      },
    },
    instructions: [
      "1. قم بزيارة https://www.linkedin.com/developers",
      "2. أنشئ تطبيقًا جديدًا",
      "3. قم بتفعيل Sign In with LinkedIn",
      "4. أضف عنوان OAuth redirect URI: https://your-domain.com/api/auth/linkedin/callback",
    ],
  },
};

// إنشاء مخطط Zod للتحقق من صحة البيانات
export const formSchema = z.object(
  Object.fromEntries(
    Object.entries(platformConfig).map(([platform, config]) => [
      platform,
      z.object(
        Object.fromEntries(
          Object.entries(config.fields).map(([key, field]) => [
            key,
            z.string().min(1, `${field.label} مطلوب`),
          ])
        )
      ),
    ])
  )
);

export type FormData = z.infer<typeof formSchema>;
