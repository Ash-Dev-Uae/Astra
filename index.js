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
    .setDescription("Show Astra's commands"),

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
  console.log(`Astra is online as ${client.user.tag}`);

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
    if (interaction.commandName === "ping") {
      const embed = new EmbedBuilder()
        .setColor(0x8B5CF6)
        .setTitle("🏓 Pong!")
        .setDescription(`Latency: **${client.ws.ping}ms**`)
        .setFooter({ text: "Astra" });

      return interaction.reply({ embeds: [embed] });
    }

    if (interaction.commandName === "help") {
      const embed = new EmbedBuilder()
        .setColor(0x8B5CF6)
        .setTitle("Astra Commands")
        .setDescription("Here are my available commands:")
        .addFields(
          { name: "/ping", value: "Check my latency.", inline: true },
          { name: "/help", value: "Show this menu.", inline: true },
          { name: "/serverinfo", value: "View server information.", inline: true },
          { name: "/userinfo", value: "View user information.", inline: true }
        )
        .setFooter({ text: "More commands coming soon!" });

      return interaction.reply({ embeds: [embed] });
    }

    if (interaction.commandName === "serverinfo") {
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
          { name: "Members", value: `${guild.memberCount}`, inline: true },
          {
            name: "Created",
            value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`,
            inline: true
          }
        )
        .setFooter({ text: "Astra Server Info" });

      return interaction.reply({ embeds: [embed] });
    }

    if (interaction.commandName === "userinfo") {
      const user =
        interaction.options.getUser("user") || interaction.user;

      const member = interaction.guild
        ? await interaction.guild.members.fetch(user.id).catch(() => null)
        : null;

      const embed = new EmbedBuilder()
        .setColor(0x8B5CF6)
        .setTitle(`User Information: ${user.username}`)
        .setThumbnail(user.displayAvatarURL())
        .addFields(
          { name: "Username", value: user.username, inline: true },
          { name: "User ID", value: user.id, inline: true },
          {
            name: "Account Created",
            value: `<t:${Math.floor(user.createdTimestamp / 1000)}:D>`,
            inline: true
          },
          {
            name: "Joined Server",
            value: member
              ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>`
              : "Not available",
            inline: true
          }
        )
        .setFooter({ text: "Astra User Info" });

      return interaction.reply({ embeds: [embed] });
    }
  } catch (error) {
    console.error(error);

    const response = {
      content: "Something went wrong executing this command.",
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
