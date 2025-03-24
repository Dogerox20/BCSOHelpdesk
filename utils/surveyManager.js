// utils/surveyManager.js
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  Events,
} = require('discord.js');

const surveyLogChannelId = '1350619016737329254';
const activeSurveys = new Map();

const questions = [
  { key: 'email', label: 'What is your primary email?' },
  { key: 'name', label: 'What is your First Name Initial, Last Name? (Ex. J. Doe)' },
  { key: 'calls', label: 'How many calls did you respond to?' },
  { key: 'precinct', label: 'What precinct were you active as?' },
  { key: 'division', label: 'Did you activate any division or specialized Unit? If so, which one?' },
  { key: 'notes', label: 'Anything else you would like to add on?' }
];

function formatEmbed(user, index, answers) {
  const q = questions[index];
  const embed = new EmbedBuilder()
    .setTitle(`🚨 Post-Shift Survey (${index + 1}/6)`)
    .setDescription(q.label)
    .setFooter({ text: `Question ${index + 1} of 6` })
    .setColor('#3498db');

  if (answers[q.key]) {
    embed.addFields({ name: 'Your Response', value: answers[q.key], inline: false });
  }

  return embed;
}

async function startSurvey(user, client) {
  const dm = await user.createDM();
  const survey = { index: 0, answers: {}, userId: user.id };
  activeSurveys.set(user.id, survey);

  const collector = dm.createMessageCollector({ filter: m => m.author.id === user.id });

  collector.on('collect', async (msg) => {
    const current = activeSurveys.get(user.id);
    if (!current) return;

    const qKey = questions[current.index].key;
    current.answers[qKey] = msg.content;
    current.index++;

    if (current.index >= questions.length) {
      collector.stop();
      await completeSurvey(user, current.answers, client);
    } else {
      await sendQuestion(dm, user, current);
    }
  });

  await sendQuestion(dm, user, survey);
}

async function sendQuestion(dm, user, survey) {
  const embed = formatEmbed(user, survey.index, survey.answers);
  await dm.send({ embeds: [embed] });
}

async function completeSurvey(user, answers, client) {
  const channel = await client.channels.fetch(surveyLogChannelId);

  const embed = new EmbedBuilder()
    .setTitle(`📋 Post-Clockout Survey - ${user.tag}`)
    .setDescription(`Responses submitted by <@${user.id}>`)
    .setColor('#2ecc71')
    .setTimestamp();

  for (const q of questions) {
    embed.addFields({ name: q.label, value: answers[q.key] || 'No response' });
  }

  await channel.send({ embeds: [embed] });
  activeSurveys.delete(user.id);

  try {
    const dm = await user.createDM();
    await dm.send('✅ Thanks! Your survey has been submitted successfully.\nIf you need to edit any of your responses please contact a Sergeant.');
  } catch {}
}

function hasPendingSurvey(userId) {
  return activeSurveys.has(userId);
}

function registerSurveyListeners(client) {
  // Edit handling removed
}

module.exports = {
  startSurvey,
  hasPendingSurvey,
  registerSurveyListeners
};