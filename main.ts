import { Bot } from "gramio";
import { config } from "./config";
import { startWebApp } from "./picker";
import { _ } from "./txt";
import { squares } from "./color-squares";
import { createLogger, logError } from "./logger";

// Initialize logger for this module
const logger = createLogger('bot');

// Initialize the bot with token from environment variable
const bot = new Bot(config.botToken);

// Command: /start - Welcome message
bot.command("start", (context) => {
  return context.send(
    _.welcomeMessage
  );
});

// Command: /pick - Show persistent color picker button
bot.command("pick", (context) => {
  logger.info({
    command: '/pick',
    userId: (context as any).from?.id,
    userName: (context as any).from?.first_name,
    username: (context as any).from?.username
  }, 'User requested color picker');
  
  return context.send(_.pickCommandMessage, {
    reply_markup: {
      keyboard: [
        [
          {
            text: _.colorPickerButton,
            web_app: { url: `${config.webAppUrl}/picker` }
          }
        ]
      ],
      resize_keyboard: true,
      is_persistent: true
    }
  });
});

// Handle web app data (gramio has a specific context for this!)
bot.on("web_app_data", async (context) => {
  const color = (context as any).data;
  
  logger.info({
    event: 'web_app_data',
    color,
    userId: (context as any).from?.id,
    username: (context as any).from?.username
  }, 'Web app data received');

  try {
    logger.info({
      event: 'generate_combinations',
      color,
      userId: (context as any).from?.id,
      username: (context as any).from?.username
    }, 'Generating wardrobe combinations');
    
    // Generate multiple 3-color combinations
    const combinations = await squares(color);
    
    // Send initial message
    await context.send(_.colorPickedSuccess(color));
    
    // Send each combination as a separate photo with descriptions
    await context.sendPhoto(combinations[0], { caption: _.combo1 });
    await context.sendPhoto(combinations[1], { caption: _.combo2 });
    await context.sendPhoto(combinations[2], { caption: _.combo3 });
    await context.sendPhoto(combinations[3], { caption: _.combo4 });
    await context.sendPhoto(combinations[4], { caption: _.combo5 });

    // Добавляем кнопку для повторной генерации экспериментального сочетания
    await context.send(_.regenerateMessage, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: _.regenerateButton,
              callback_data: `regenerate:${color}`
            }
          ]
        ]
      }
    });
  } catch (error) {
    logError(error, {
      event: 'web_app_data',
      color,
      userId: (context as any).from?.id,
      username: (context as any).from?.username,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Handle callback queries (button presses)
bot.on("callback_query", async (context) => {
  const callbackData = (context as any).data;
  
  logger.info({
    event: 'callback_query',
    callbackData,
    userId: (context as any).from?.id
  }, 'Callback query received');
  
  if (callbackData?.startsWith("regenerate:")) {
    try {
      // Extract color from callback data
      const color = callbackData.replace("regenerate:", "");
      
      logger.info({
        event: 'regenerate',
        color,
        userId: (context as any).from?.id,
        username: (context as any).from?.username,
      }, 'Regenerating experimental combination');
      
      // Generate new combinations (the experimental one will be different due to random)
      const combinations = await squares(color);
      
      // Send only the experimental combination (5th one)
      await context.sendPhoto(combinations[4], { caption: _.combo5 });

      // Send regenerate message with button
      await context.send(_.regenerateMessage, {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: _.regenerateButton,
                callback_data: `regenerate:${color}`
              }
            ]
          ]
        }
      });
      
      // Answer callback query to remove loading state
      await (context as any).answerCallbackQuery();
    } catch (error) {
      logError(error, {
        event: 'regenerate',
        color: callbackData.replace("regenerate:", ""),
        userId: (context as any).from?.id,
        username: (context as any).from?.username,
      });
      await (context as any).answerCallbackQuery({ text: "❌ Ошибка при генерации" });
    }
  }
});

// Handle text messages
bot.on("message", async (context) => {
  // Handle unknown commands
  if (context.text?.startsWith("/")) {
    logger.warn({
      event: 'unknown_command',
      command: context.text,
      userId: (context as any).from?.id
    }, 'Unknown command received');
    return context.send(_.unknownCommandError);
  }
  
  // Log any other messages
  if (context.text) {
    logger.debug({
      event: 'text_message',
      messageLength: context.text.length,
      userId: (context as any).from?.id
    }, 'Text message received');
  }
});

// Start the web app server and bot
async function start() {
  try {
    // Start web app server first
    await startWebApp();
    
    // Then start the bot
    logger.info('Starting bot...');
    bot.start();
    logger.info('Bot started successfully');
  } catch (error) {
    logError(error, { action: 'start_bot' });
    process.exit(1);
  }
}

start();

// Handle graceful shutdown
process.once("SIGINT", () => {
  logger.info('Received SIGINT, shutting down bot...');
  bot.stop();
  process.exit(0);
});

process.once("SIGTERM", () => {
  logger.info('Received SIGTERM, shutting down bot...');
  bot.stop();
  process.exit(0);
});
