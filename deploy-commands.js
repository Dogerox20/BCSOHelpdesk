require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Load all commands from /commands folder
for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
  } else {
    console.warn(`[WARNING] The command at ${file} is missing "data" or "execute".`);
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

// CHOOSE ONE:
const clientId = process.env.CLIENT_ID; // Your app/bot ID
const guildId = process.env.GUILD_ID;   // Your test server ID

// Option 1: Register to a GUILD (for testing)
rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })

// Option 2: Uncomment below for GLOBAL commands
// rest.put(Routes.applicationCommands(clientId), { body: commands })

  .then(() => console.log('✅ Successfully registered application commands.'))
  .catch(console.error);
