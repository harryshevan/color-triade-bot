import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

export const config = {
  botToken: process.env.BOT_TOKEN as string,
  webAppPort: parseInt(process.env.WEB_APP_PORT || '3000'),
  webAppUrl: process.env.WEB_APP_URL || 'http://localhost:3000',
}
