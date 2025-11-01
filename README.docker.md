# Docker Setup for Colorbot

This guide explains how to run the Colorbot application using Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose installed
- A Telegram bot token (get one from [@BotFather](https://t.me/botfather))
- A publicly accessible URL for the web app (for Telegram Mini App)

## Environment Setup

1. **Create your `.env` file** by copying the example:
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env`** and fill in your values:
   ```env
   BOT_TOKEN=your_actual_telegram_bot_token
   WEB_APP_PORT=3000
   WEB_APP_URL=https://your-domain.com
   ```

   > **Note**: The `WEB_APP_URL` must be publicly accessible for Telegram Mini Apps to work.

## Running with Docker Compose

### Production Mode

Build and start the bot:
```bash
docker-compose up -d
```

View logs:
```bash
docker-compose logs -f colorbot
```

Stop the bot:
```bash
docker-compose down
```

### Development Mode

The development mode includes hot reload for easier development:

```bash
docker-compose --profile dev up colorbot-dev
```

This will:
- Mount your source code as a volume
- Use `tsx` for hot reloading
- Run the development server

## Building the Docker Image

To build the image manually:
```bash
docker build -t colorbot:latest .
```

## Running without Docker Compose

If you prefer to run the container directly:

```bash
docker run -d \
  --name colorbot \
  -p 3000:3000 \
  --env-file .env \
  colorbot:latest
```

## Security with dotenvx

This Docker setup uses [dotenvx](https://dotenvx.com) to handle environment variables securely:

- **prebuild**: Prevents `.env` files from being baked into the Docker image
- **runtime**: Loads environment variables securely when the container starts
- Your `.env` file is mounted as a read-only volume at runtime

This approach ensures:
1. Secrets never end up in the Docker image layers
2. You can change environment variables without rebuilding
3. Better security practices for production deployments

## Health Checks

The production container includes a health check that:
- Pings the web app every 30 seconds
- Allows 40 seconds for initial startup
- Marks the container unhealthy after 3 failed checks

## Resource Limits (Optional)

Uncomment the `deploy.resources` section in `docker-compose.yml` to set CPU and memory limits for your container.

## Troubleshooting

### Container exits immediately
Check logs: `docker-compose logs colorbot`

Common issues:
- Missing or invalid `BOT_TOKEN`
- Port 3000 already in use
- `.env` file not found

### Bot doesn't respond
- Verify your `BOT_TOKEN` is correct
- Check that `WEB_APP_URL` is publicly accessible
- Review logs for errors

### Web app not accessible
- Ensure port 3000 is exposed and not blocked by firewall
- Verify the container is running: `docker ps`
- Check if the port mapping is correct in docker-compose.yml

## Production Deployment

For production deployments:

1. **Use HTTPS**: Telegram requires HTTPS for Mini Apps
2. **Set up reverse proxy**: Use nginx or similar to proxy to port 3000
3. **Enable SSL**: Get a certificate from Let's Encrypt or similar
4. **Update WEB_APP_URL**: Set it to your public HTTPS URL
5. **Consider secrets management**: Use Docker Secrets or a secrets manager instead of `.env` files

Example with nginx reverse proxy:
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

