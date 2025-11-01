import { Bot } from "gramio";
import { config } from "./config";
import { startWebApp } from "./picker";
import { _ } from "./txt";
import { squares } from "./color-squares";

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
  console.log(`📱 /pick command from ${(context as any).from?.first_name || 'unknown'}`);
  
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
  console.log("🎨 Web App Data received!");
  console.log("🎨 Color:", (context as any).data);
  console.log("🎨 Button text:", (context as any).buttonText);
  
  const color = (context as any).data;
  
  try {
    console.log(`🎨 Generating wardrobe combinations for: ${color}`);
    
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
    console.error("❌ Error:", error);
  }
});

// Handle callback queries (button presses)
bot.on("callback_query", async (context) => {
  const callbackData = (context as any).data;
  console.log(`🔘 Callback query received: ${callbackData}`);
  
  if (callbackData?.startsWith("regenerate:")) {
    try {
      // Extract color from callback data
      const color = callbackData.replace("regenerate:", "");
      console.log(`🎲 Regenerating experimental combination for: ${color}`);
      
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
      console.error("❌ Error regenerating:", error);
      await (context as any).answerCallbackQuery({ text: "❌ Ошибка при генерации" });
    }
  }
});

// Handle text messages
bot.on("message", async (context) => {
  // Handle unknown commands
  if (context.text?.startsWith("/")) {
    console.log(`❌ Unknown command: ${context.text}`);
    return context.send(_.unknownCommandError);
  }
  
  // Log any other messages
  if (context.text) {
    console.log(`📝 Text message: "${context.text}"`);
  }
});

// Start the web app server and bot
async function start() {
  try {
    // Start web app server first
    await startWebApp();
    
    // Then start the bot
    console.log("🚀 Starting bot...");
    bot.start();
    console.log("✅ Bot started successfully!");
  } catch (error) {
    console.error("Error starting bot:", error);
    process.exit(1);
  }
}

start();

// Handle graceful shutdown
process.once("SIGINT", () => {
  console.log("\n🛑 Shutting down bot...");
  bot.stop();
  process.exit(0);
});

process.once("SIGTERM", () => {
  console.log("\n🛑 Shutting down bot...");
  bot.stop();
  process.exit(0);
});
