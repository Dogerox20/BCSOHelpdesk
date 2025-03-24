require('dotenv').config();

module.exports = {
  ALLOWED_ROLE_ID: process.env.ALLOWED_ROLE_ID,
  GENERAL_SHEET_ID: process.env.SHEET_ID,
  BOT_DATABASE_SHEET_ID: process.env.BOT_DATABASE_SHEET_ID,
  CLIENT_ID: process.env.CLIENT_ID,
  GUILD_ID: process.env.GUILD_ID,
};
