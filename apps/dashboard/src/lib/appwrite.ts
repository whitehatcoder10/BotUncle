import { Account, Client, Databases } from 'appwrite'

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT ?? ''
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID ?? ''

export const isAppwriteConfigured = Boolean(endpoint && projectId)

const client = new Client()

if (isAppwriteConfigured) {
  client.setEndpoint(endpoint).setProject(projectId)
}

/** Browser-side Appwrite client (dashboard only — never put API keys here). */
export { client }

/** Auth: signup, login, sessions — used by the business owner in the dashboard. */
export const account = new Account(client)

/** Database reads/writes from the dashboard (collections Appwrite permissions allow). */
export const databases = new Databases(client)

export async function createSessionJwt(): Promise<string> {
  const session = await account.createJWT()
  const jwt = typeof session === 'string' ? session : session.jwt
  if (!jwt) {
    throw new Error('Could not create Appwrite session token')
  }
  return jwt
}
