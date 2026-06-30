export const appwriteConfig = {
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID ?? '',
  collections: {
    businesses: import.meta.env.VITE_APPWRITE_BUSINESSES_COLLECTION_ID ?? '',
    plans: import.meta.env.VITE_APPWRITE_PLANS_COLLECTION_ID ?? '',
  },
} as const

export const isDatabaseConfigured = Boolean(
  appwriteConfig.databaseId &&
    appwriteConfig.collections.businesses &&
    appwriteConfig.collections.plans,
)
