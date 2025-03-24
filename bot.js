// bot.js
require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const logCommand = require('./utils/embedLogger');
const { registerSurveyListeners } = require('./utils/surveyManager');
const sendHeartbeat = require('./utils/heartbeat');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: ['CHANNEL'],
});

client.commands = new Collection();

// Load commands from /commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.warn(`[WARNING] The command at ${filePath} is missing "data" or "execute".`);
  }
}

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(error);
    if (!interaction.replied) {
      await interaction.reply({ content: '❌ There was an error executing this command.', ephemeral: true });
    }
    await logCommand({
      client,
      commandName: interaction.commandName,
      user: interaction.user,
      status: 'Error',
      description: error.message,
    });
  }
});

// Register survey listeners for modals/buttons
registerSurveyListeners(client);

// Start Better Stack Heartbeat
setInterval(sendHeartbeat, 60 * 1000); // every 60 seconds

client.login(process.env.DISCORD_TOKEN);
