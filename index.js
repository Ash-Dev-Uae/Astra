require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const commands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check Astra's response time"),

  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show Astra's command menu"),

  new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Show information about this server"),

  new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Show information about a user")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("The user to check")
        .setRequired(false)
    )
].map(command => command.toJSON());

const clientId = process.env.CLIENT_ID;
const token = process.env.TOKEN;
const guildId = process.env.GUILD_ID;

if (!token || !clientId) {
  console.error("Missing TOKEN or CLIENT_ID.");
  process.exit(1);
}

client.once("ready", async () => {
  console.log("Astra is online as " + client.user.tag);

  try {
    const rest = new REST({ version: "10" }).setToken(token);

    if (guildId) {
      await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands }
      );
      console.log("Guild commands registered!");
    } else {
      await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands }
      );
      console.log("Global commands registered!");
    }
  } catch (error) {
    console.error("Failed to register commands:", error);
  }
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  try {
    switch (interaction.commandName) {
      case "ping": {
        const embed = new EmbedBuilder()
          .setColor(0x8B5CF6)
          .setTitle("🏓 Pong!")
          .setDescription("Latency: **" + client.ws.ping + "ms**")
          .setFooter({ text: "Astra • General" });

        return interaction.reply({ embeds: [embed] });
      }

      case "help": {
        const embed = new EmbedBuilder()
          .setColor(0x8B5CF6)
          .setAuthor({
            name: "Astra • Command Centre",
            iconURL: client.user.displayAvatarURL()
          })
          .setTitle("Help & Commands")
          .setDescription(
            "Here are the commands currently available in Astra. More features are being added!"
          )
          .addFields(
            {
              name: "🌐 General",
              value: [
                "`/ping` — Check Astra's response time",
                "`/help` — Open this command menu"
              ].join("\n"),
              inline: false
            },
            {
              name: "🛡️ Server",
              value: "`/serverinfo` — View this server's information",
              inline: false
            },
            {
              name: "👤 User",
              value: "`/userinfo [user]` — View your information or another user's",
              inline: false
            },
            {
              name: "🚧 Coming soon",
              value: "Moderation • Tickets • Staff tools • Logging",
              inline: false
            }
          )
          .setThumbnail(client.user.displayAvatarURL())
          .setFooter({
            text: "Astra • Built to make server management easier"
          });

        return interaction.reply({ embeds: [embed] });
      }

      case "serverinfo": {
        const guild = interaction.guild;

        if (!guild) {
          return interaction.reply({
            content: "This command can only be used in a server.",
            ephemeral: true
          });
        }

        const embed = new EmbedBuilder()
          .setColor(0x8B5CF6)
          .setTitle(guild.name)
          .setThumbnail(guild.iconURL())
          .addFields(
            { name: "Server ID", value: guild.id, inline: true },
            { name: "Members", value: String(guild.memberCount), inline: true },
            {
              name: "Created",
              value: "<t:" + Math.floor(guild.createdTimestamp / 1000) + ":D>",
              inline: true
            }
          )
          .setFooter({ text: "Astra • Server Information" });

        return interaction.reply({ embeds: [embed] });
      }

      case "userinfo": {
        const user =
          interaction.options.getUser("user") || interaction.user;

        const member = interaction.guild
          ? await interaction.guild.members.fetch(user.id).catch(() => null)
          : null;

        const embed = new EmbedBuilder()
          .setColor(0x8B5CF6)
          .setTitle("User Information: " + user.username)
          .setThumbnail(user.displayAvatarURL())
          .addFields(
            { name: "Username", value: user.username, inline: true },
            { name: "User ID", value: user.id, inline: true },
            {
              name: "Account Created",
              value: "<t:" + Math.floor(user.createdTimestamp / 1000) + ":D>",
              inline: true
            },
            {
              name: "Joined Server",
              value: member
                ? "<t:" + Math.floor(member.joinedTimestamp / 1000) + ":D>"
                : "Not available",
              inline: true
            }
          )
          .setFooter({ text: "Astra • User Information" });

        return interaction.reply({ embeds: [embed] });
      }

      default:
        return interaction.reply({
          content: "I don't recognize that command yet. Try /help.",
          ephemeral: true
        });
    }
  } catch (error) {
    console.error("Command error:", error);

    const response = {
      content: "Something went wrong while running this command.",
      ephemeral: true
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(response).catch(() => {});
    } else {
      await interaction.reply(response).catch(() => {});
    }
  }
});

client.login(token);
