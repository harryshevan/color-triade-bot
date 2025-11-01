# Quick Start Guide

Get your Colorbot up and running with Docker in 5 minutes!

## Prerequisites

- Docker and Docker Compose installed
- A Telegram bot token from [@BotFather](https://t.me/botfather)
- A public URL/domain (required for Telegram Mini App)

## Steps

### 1. Setup Environment Variables

Create your `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrSTUvwxyz
WEB_APP_PORT=3000
WEB_APP_URL=https://yourdomain.com
```

> **Important**: `WEB_APP_URL` must be publicly accessible over HTTPS for Telegram Mini Apps to work.

### 2. Build and Run

```bash
docker-compose up -d
```

That's it! Your bot is now running.

### 3. Check Status

```bash
# View logs
docker-compose logs -f

# Check if container is healthy
docker ps
```

### 4. Test Your Bot

1. Open Telegram
2. Search for your bot
3. Send `/start` to see the welcome message
4. Send `/pick` to get the color picker button

## Development Mode

For local development with hot reload:

```bash
docker-compose --profile dev up colorbot-dev
```

## Common Commands

```bash
# Stop the bot
docker-compose down

# Restart the bot
docker-compose restart

# View logs
docker-compose logs -f colorbot

# Rebuild after code changes
docker-compose up -d --build

# Remove everything (containers, volumes, images)
docker-compose down -v --rmi all
```

## Troubleshooting

### Bot doesn't start
- Check logs: `docker-compose logs colorbot`
- Verify `BOT_TOKEN` is correct in `.env`

### Web app not accessible
- Ensure port 3000 is not in use: `lsof -i :3000`
- Check firewall settings

### Health check failing
- Wait 40 seconds for initial startup
- Check logs for errors

## Production Deployment

For production, you'll need:

1. **HTTPS Setup**: Telegram requires HTTPS for Mini Apps
2. **Reverse Proxy**: Use nginx, Caddy, or Traefik
3. **Domain**: Point your domain to your server
4. **SSL Certificate**: Use Let's Encrypt

Example with Caddy (automatic HTTPS):

```bash
# Install Caddy
# Create Caddyfile:
yourdomain.com {
    reverse_proxy localhost:3000
}

# Run Caddy
caddy run
```

Then update `.env`:
```env
WEB_APP_URL=https://yourdomain.com
```

## Next Steps

- Read [README.docker.md](./README.docker.md) for detailed documentation
- Configure resource limits in `docker-compose.yml`
- Set up monitoring and logging
- Configure backup strategies

## Need Help?

Check the full documentation in [README.docker.md](./README.docker.md) for:
- Detailed configuration options
- Security best practices
- Advanced deployment scenarios
- Complete troubleshooting guide

