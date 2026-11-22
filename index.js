
require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const PURPLE = 0x8B5CF6;

const commands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check Astra's response time"),

  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show Astra's command menu"),

  new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Show server information"),

  new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Show user information")
    .addUserOption(o =>
      o.setName("user").setDescription("User to check")
    ),

  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(o =>
      o.setName("user").setDescription("Member to ban").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("reason").setDescription("Reason for the ban")
    ),

  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(o =>
      o.setName("user").setDescription("Member to kick").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("reason").setDescription("Reason for the kick")
    ),

  new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Timeout a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o =>
      o.setName("user").setDescription("Member to timeout").setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName("minutes")
        .setDescription("Duration in minutes")
        .setMinValue(1)
        .setMaxValue(40320)
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("reason").setDescription("Reason for the timeout")
    ),

  new SlashCommandBuilder()
    .setName("untimeout")
    .setDescription("Remove a member's timeout")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o =>
      o.setName("user").setDescription("Member to untimeout").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Delete recent messages")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(o =>
      o.setName("amount")
        .setDescription("Number of messages")
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("lock")
    .setDescription("Lock this channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder()
    .setName("unlock")
    .setDescription("Unlock this channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder()
    .setName("slowmode")
    .setDescription("Set channel slowmode")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addIntegerOption(o =>
      o.setName("seconds")
        .setDescription("Delay in seconds (0 to disable)")
        .setMinValue(0)
        .setMaxValue(21600)
        .setRequired(true)
    )
].map(c => c.toJSON());

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId) {
  console.error("Missing TOKEN or CLIENT_ID.");
  process.exit(1);
}

client.once("ready", async () => {
  console.log("Astra online as " + client.user.tag);

  try {
    const rest = new REST({ version: "10" }).setToken(token);

    if (guildId) {
      await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands }
      );
    } else {
      await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands }
      );
    }

    console.log("Astra commands registered!");
  } catch (error) {
    console.error("Command registration failed:", error);
  }
});

function deny(i, message) {
  return i.reply({ content: message, ephemeral: true });
}

async function getMember(guild, userId) {
  return guild.members.fetch(userId).catch(() => null);
}

client.on("interactionCreate", async i => {
  if (!i.isChatInputCommand()) return;

  try {
    const name = i.commandName;

    if (name === "ping") {
      const embed = new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle("Pong!")
        .setDescription("Latency: **" + client.ws.ping + "ms**");

      return i.reply({ embeds: [embed] });
    }

    if (name === "help") {
      const embed = new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle("Astra Command Centre")
        .setDescription("Your all-in-one Discord server assistant.")
        .addFields(
          {
            name: "General",
            value: "`/ping` `/help` `/serverinfo` `/userinfo`"
          },
          {
            name: "Moderation",
            value: "`/ban` `/kick` `/timeout` `/untimeout` `/purge` `/lock` `/unlock` `/slowmode`"
          },
          {
            name: "Coming soon",
            value: "Warnings • Tickets • Logging • Welcome • Leveling • Economy"
          }
        )
        .setThumbnail(client.user.displayAvatarURL());

      return i.reply({ embeds: [embed] });
    }

    if (name === "serverinfo") {
      if (!i.guild) return deny(i, "Use this inside a server.");

      const g = i.guild;
      const embed = new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle(g.name)
        .setThumbnail(g.iconURL())
        .addFields(
          { name: "Server ID", value: g.id, inline: true },
          { name: "Members", value: String(g.memberCount), inline: true },
          {
            name: "Created",
            value: "<t:" + Math.floor(g.createdTimestamp / 1000) + ":D>",
            inline: true
          }
        );

      return i.reply({ embeds: [embed] });
    }

    if (name === "userinfo") {
      const user = i.options.getUser("user") || i.user;
      const member = i.guild
        ? await getMember(i.guild, user.id)
        : null;

      const embed = new EmbedBuilder()
        .setColor(PURPLE)
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
        );

      return i.reply({ embeds: [embed] });
    }

    if (["ban", "kick", "timeout", "untimeout"].includes(name)) {
      if (!i.guild) return deny(i, "Use this inside a server.");

      const user = i.options.getUser("user", true);
      const reason = i.options.getString("reason") || "No reason provided.";

      if (user.id === i.user.id) {
        return deny(i, "You cannot moderate yourself.");
      }

      if (user.id === i.guild.ownerId) {
        return deny(i, "The server owner cannot be moderated.");
      }

      const member = await getMember(i.guild, user.id);

      if (name !== "ban" && !member) {
        return deny(i, "That user is not in this server.");
      }

      if (member && !member.manageable) {
        return deny(i, "Astra cannot moderate that member because of role hierarchy.");
      }

      const permissions = {
        ban: PermissionFlagsBits.BanMembers,
        kick: PermissionFlagsBits.KickMembers,
        timeout: PermissionFlagsBits.ModerateMembers,
        untimeout: PermissionFlagsBits.ModerateMembers
      };

      const permission = permissions[name];

      if (
        !i.memberPermissions.has(permission) ||
        !i.guild.members.me.permissions.has(permission)
      ) {
        return deny(i, "You or Astra is missing the required permission.");
      }

      if (name === "ban") {
        if (member && !member.bannable) {
          return deny(i, "Astra cannot ban that member.");
        }

        await i.guild.members.ban(user.id, {
          reason: reason + " | Moderator: " + i.user.tag
        });

        return i.reply({
          content: user.tag + " was banned. Reason: " + reason,
          ephemeral: true
        });
      }

      if (name === "kick") {
        if (!member.kickable) {
          return deny(i, "Astra cannot kick that member.");
        }

        await member.kick(reason);

        return i.reply({
          content: user.tag + " was kicked. Reason: " + reason,
          ephemeral: true
        });
      }

      if (name === "timeout") {
        const minutes = i.options.getInteger("minutes", true);

        await member.timeout(minutes * 60000, reason);

        return i.reply({
          content: user.tag + " was timed out for " + minutes + " minutes.",
          ephemeral: true
        });
      }

      if (!member.communicationDisabledUntilTimestamp) {
        return deny(i, "That member isn't timed out.");
      }

      await member.timeout(null, "Timeout removed by " + i.user.tag);

      return i.reply({
        content: "Timeout removed for " + user.tag + ".",
        ephemeral: true
      });
    }

    if (name === "purge") {
      if (!i.guild || !i.channel || !i.channel.isTextBased()) {
        return deny(i, "Use this in a text channel.");
      }

      if (
        !i.memberPermissions.has(PermissionFlagsBits.ManageMessages) ||
        !i.guild.members.me.permissions.has(PermissionFlagsBits.ManageMessages)
      ) {
        return deny(i, "Manage Messages permission is required.");
      }

      const amount = i.options.getInteger("amount", true);
      const deleted = await i.channel.bulkDelete(amount, true);

      return i.reply({
        content: "Deleted " + deleted.size + " recent messages. Messages older than 14 days cannot be bulk deleted.",
        ephemeral: true
      });
    }

    if (name === "lock" || name === "unlock") {
      if (!i.guild || !i.channel || !i.channel.isTextBased()) {
        return deny(i, "Use this in a server text channel.");
      }

      if (
        !i.memberPermissions.has(PermissionFlagsBits.ManageChannels) ||
        !i.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)
      ) {
        return deny(i, "Manage Channels permission is required.");
      }

      await i.channel.permissionOverwrites.edit(
        i.guild.roles.everyone,
        { SendMessages: name === "lock" ? false : null },
        { reason: name + " by " + i.user.tag }
      );

      return i.reply({
        content: name === "lock"
          ? "Channel locked for @everyone."
          : "Channel unlocked for @everyone."
      });
    }

    if (name === "slowmode") {
      if (!i.guild || !i.channel || typeof i.channel.setRateLimitPerUser !== "function") {
        return deny(i, "Slowmode is not supported in this channel.");
      }

      if (
        !i.memberPermissions.has(PermissionFlagsBits.ManageChannels) ||
        !i.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)
      ) {
        return deny(i, "Manage Channels permission is required.");
      }

      const seconds = i.options.getInteger("seconds", true);

      await i.channel.setRateLimitPerUser(seconds);

      return i.reply({
        content: seconds === 0
          ? "Slowmode disabled."
          : "Slowmode set to " + seconds + " seconds."
      });
    }

    return deny(i, "Unknown command. Try /help.");

  } catch (error) {
    console.error("Command error:", error);

    const response = {
      content: "Something went wrong. Check Astra's Railway logs.",
      ephemeral: true
    };

    if (i.replied || i.deferred) {
      await i.followUp(response).catch(() => {});
    } else {
      await i.reply(response).catch(() => {});
    }
  }
});

client.login(token);
