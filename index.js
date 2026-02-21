const {
    Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder,
    REST, Routes, ActivityType, PermissionsBitField,
    ApplicationIntegrationType, InteractionContextType, MessageFlags,
    Collection
} = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration
    ]
});

// ========== CONSTANTS ==========
const DEFAULT_PREFIX = '!';
let commandPrefix = DEFAULT_PREFIX;          // can be changed with /prefix
let logChannelId = null;                     // set with /log channel

// Cooldowns for prefix commands (simple map)
const cooldowns = new Collection();

// ========== USER DATA (safe mode) ==========
const userSafeMode = new Map(); // userId -> boolean

// ========== SLASH COMMANDS ==========
const commands = [
    // ----- USER-INSTALL COMMANDS -----
    new SlashCommandBuilder()
        .setName('say')
        .setDescription('Make the bot say something')
        .addStringOption(opt => opt.setName('message').setDescription('The message to say').setRequired(true))
        .setIntegrationTypes(ApplicationIntegrationType.UserInstall)
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),

    new SlashCommandBuilder()
        .setName('howgay')
        .setDescription('Check someone\'s gay percentage')
        .addUserOption(opt => opt.setName('user').setDescription('The user to check').setRequired(false))
        .setIntegrationTypes(ApplicationIntegrationType.UserInstall)
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),

    new SlashCommandBuilder()
        .setName('safemode')
        .setDescription('Toggle safe mode (embeds YOUR messages)')
        .setIntegrationTypes(ApplicationIntegrationType.UserInstall)
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),

    new SlashCommandBuilder()
        .setName('checksafemode')
        .setDescription('Check your current safe mode status')
        .setIntegrationTypes(ApplicationIntegrationType.UserInstall)
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),

    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check bot latency')
        .setIntegrationTypes(ApplicationIntegrationType.UserInstall)
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),

    new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show all available commands')
        .setIntegrationTypes(ApplicationIntegrationType.UserInstall)
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),

    // ----- GUILD-ONLY MODERATION COMMANDS -----
    new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user from the server')
        .addUserOption(opt => opt.setName('user').setDescription('The user to ban').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for the ban').setRequired(false))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers)
        .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
        .setContexts(InteractionContextType.Guild),

    new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user from the server')
        .addUserOption(opt => opt.setName('user').setDescription('The user to kick').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for the kick').setRequired(false))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.KickMembers)
        .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
        .setContexts(InteractionContextType.Guild),

    new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a user (logs to log channel)')
        .addUserOption(opt => opt.setName('user').setDescription('The user to warn').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for the warning').setRequired(true))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers)
        .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
        .setContexts(InteractionContextType.Guild),

    new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Delete a specific number of messages')
        .addIntegerOption(opt =>
            opt.setName('amount')
                .setDescription('Number of messages to delete (1-100)')
                .setRequired(true).setMinValue(1).setMaxValue(100)
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
        .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
        .setContexts(InteractionContextType.Guild),

    new SlashCommandBuilder()
        .setName('lockdown')
        .setDescription('Lock a channel for a set time (in minutes)')
        .addChannelOption(opt => opt.setName('channel').setDescription('The channel to lock').setRequired(true))
        .addIntegerOption(opt =>
            opt.setName('duration')
                .setDescription('Duration in minutes (0 = indefinite)')
                .setRequired(true).setMinValue(0)
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels)
        .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
        .setContexts(InteractionContextType.Guild),

    new SlashCommandBuilder()
        .setName('unlockdown')
        .setDescription('Unlock a channel')
        .addChannelOption(opt => opt.setName('channel').setDescription('The channel to unlock').setRequired(true))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels)
        .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
        .setContexts(InteractionContextType.Guild),

    new SlashCommandBuilder()
        .setName('prefix')
        .setDescription('Change the command prefix for message commands')
        .addStringOption(opt => opt.setName('new_prefix').setDescription('New prefix').setRequired(true))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
        .setContexts(InteractionContextType.Guild),

    new SlashCommandBuilder()
        .setName('log')
        .setDescription('Set the channel for logging moderation actions')
        .addSubcommand(sub =>
            sub.setName('channel')
                .setDescription('Set the log channel')
                .addChannelOption(opt => opt.setName('channel').setDescription('The channel to send logs').setRequired(true))
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
        .setContexts(InteractionContextType.Guild)
].map(command => command.toJSON());

// ========== READY EVENT ==========
client.once('ready', async () => {
    console.log(`${client.user.tag} is online!`);
    client.user.setActivity({ name: '/help for commands', type: ActivityType.Playing });

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('✅ Slash commands registered globally.');
    } catch (error) {
        console.error('❌ Failed to register commands:', error);
    }
});

// ========== SLASH COMMAND HANDLER ==========
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    switch (commandName) {
        // User-install
        case 'say': await handleSay(interaction); break;
        case 'howgay': await handleHowgay(interaction); break;
        case 'safemode': await handleSafemode(interaction); break;
        case 'checksafemode': await handleCheckSafemode(interaction); break;
        case 'ping': await handlePing(interaction); break;
        case 'help': await handleHelp(interaction); break;

        // Moderation
        case 'ban': await handleBan(interaction); break;
        case 'kick': await handleKick(interaction); break;
        case 'warn': await handleWarn(interaction); break;
        case 'purge': await handlePurge(interaction); break;
        case 'lockdown': await handleLockdown(interaction); break;
        case 'unlockdown': await handleUnlockdown(interaction); break;
        case 'prefix': await handlePrefix(interaction); break;
        case 'log': await handleLog(interaction); break;
    }
});

// ========== PREFIX COMMAND HANDLER ==========
client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;

    // Safe mode processing (unchanged)
    const safeMode = userSafeMode.get(message.author.id);
    if (safeMode && !message.content.startsWith('/') && message.content.length > 0) {
        message.delete().catch(() => {});
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
            .setDescription(message.content)
            .setFooter({ text: `Sent in #${message.channel.name}` })
            .setTimestamp();
        if (message.attachments.size > 0) {
            const attachment = message.attachments.first();
            if (attachment.contentType?.startsWith('image/')) embed.setImage(attachment.url);
        }
        return message.channel.send({ embeds: [embed] });
    }

    // Prefix commands
    if (!message.content.startsWith(commandPrefix)) return;

    const args = message.content.slice(commandPrefix.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    // Cooldown (3 seconds per user per command)
    if (!cooldowns.has(cmd)) cooldowns.set(cmd, new Collection());
    const now = Date.now();
    const timestamps = cooldowns.get(cmd);
    const cooldownAmount = 3000;
    if (timestamps.has(message.author.id)) {
        const expiration = timestamps.get(message.author.id) + cooldownAmount;
        if (now < expiration) {
            const timeLeft = (expiration - now) / 1000;
            return message.reply(`⏳ Please wait ${timeLeft.toFixed(1)} seconds before using \`${cmd}\` again.`);
        }
    }
    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

    // Route prefix commands
    try {
        switch (cmd) {
            case 'ban': await prefixBan(message, args); break;
            case 'kick': await prefixKick(message, args); break;
            case 'warn': await prefixWarn(message, args); break;
            case 'purge': await prefixPurge(message, args); break;
            case 'lockdown': await prefixLockdown(message, args); break;
            case 'unlockdown': await prefixUnlockdown(message, args); break;
            case 'prefix': await prefixChangePrefix(message, args); break;
            case 'log': await prefixLog(message, args); break;
            default:
                // Unknown command – ignore
                break;
        }
    } catch (error) {
        console.error(`Error in prefix command ${cmd}:`, error);
        message.reply('❌ An error occurred while executing that command.').catch(() => {});
    }
});

// ========== REUSABLE MODERATION FUNCTIONS ==========

// ----- Ban -----
async function banUser(executor, guild, targetUser, reason = 'No reason provided') {
    if (!guild.members.me.permissions.has(PermissionsBitField.Flags.BanMembers))
        throw new Error('I don\'t have permission to ban members.');
    if (targetUser.id === executor.id) throw new Error('You cannot ban yourself.');
    if (targetUser.id === client.user.id) throw new Error('You cannot ban me.');

    const member = await guild.members.fetch(targetUser.id).catch(() => null);
    if (member && member.roles.highest.position >= guild.members.me.roles.highest.position)
        throw new Error('I cannot ban this user because they have a higher or equal role.');

    await guild.members.ban(targetUser, { reason: `${reason} (Banned by ${executor.tag})` });
    return {
        embed: new EmbedBuilder()
            .setColor(0xFF0000).setTitle('🔨 User Banned')
            .setDescription(`${targetUser.tag} has been banned`)
            .addFields(
                { name: 'Banned By', value: executor.tag, inline: true },
                { name: 'Reason', value: reason, inline: true }
            )
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .setTimestamp().setFooter({ text: `User ID: ${targetUser.id}` })
    };
}

// ----- Kick -----
async function kickUser(executor, guild, targetUser, reason = 'No reason provided') {
    if (!guild.members.me.permissions.has(PermissionsBitField.Flags.KickMembers))
        throw new Error('I don\'t have permission to kick members.');
    if (targetUser.id === executor.id) throw new Error('You cannot kick yourself.');
    if (targetUser.id === client.user.id) throw new Error('You cannot kick me.');

    const member = await guild.members.fetch(targetUser.id);
    if (member.roles.highest.position >= guild.members.me.roles.highest.position)
        throw new Error('I cannot kick this user because they have a higher or equal role.');

    await member.kick(`${reason} (Kicked by ${executor.tag})`);
    return {
        embed: new EmbedBuilder()
            .setColor(0xFFA500).setTitle('👢 User Kicked')
            .setDescription(`${targetUser.tag} has been kicked`)
            .addFields(
                { name: 'Kicked By', value: executor.tag, inline: true },
                { name: 'Reason', value: reason, inline: true }
            )
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .setTimestamp().setFooter({ text: `User ID: ${targetUser.id}` })
    };
}

// ----- Warn -----
async function warnUser(executor, guild, targetUser, reason) {
    if (!guild.members.me.permissions.has(PermissionsBitField.Flags.ModerateMembers))
        throw new Error('I don\'t have permission to warn members.');

    const embed = new EmbedBuilder()
        .setColor(0xFFA500)
        .setTitle('⚠️ User Warned')
        .setDescription(`${targetUser} has been warned.`)
        .addFields(
            { name: 'User', value: `${targetUser.tag} (${targetUser.id})`, inline: false },
            { name: 'Reason', value: reason, inline: false },
            { name: 'Warned By', value: executor.tag, inline: false }
        )
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

    if (logChannelId) {
        const logChannel = await guild.channels.fetch(logChannelId).catch(() => null);
        if (logChannel) await logChannel.send({ embeds: [embed] });
    }
    return { embed };
}

// ----- Purge -----
async function purgeMessages(channel, amount) {
    if (!channel.permissionsFor(channel.guild.members.me).has(PermissionsBitField.Flags.ManageMessages))
        throw new Error('I don\'t have permission to manage messages in that channel.');

    const messages = await channel.messages.fetch({ limit: amount });
    if (messages.size === 0) throw new Error('No messages to delete.');

    const deleted = await channel.bulkDelete(messages, true);
    return { count: deleted.size };
}

// ----- Lockdown -----
const lockdownTimers = new Map(); // channelId -> setTimeout

async function lockdownChannel(channel, durationMinutes, executor) {
    if (!channel.permissionsFor(channel.guild.members.me).has(PermissionsBitField.Flags.ManageChannels))
        throw new Error('I don\'t have permission to manage that channel.');

    await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
        SendMessages: false
    });

    // Clear any existing timer for this channel
    if (lockdownTimers.has(channel.id)) {
        clearTimeout(lockdownTimers.get(channel.id));
        lockdownTimers.delete(channel.id);
    }

    if (durationMinutes > 0) {
        const timer = setTimeout(async () => {
            try {
                await unlockChannel(channel);
                const logEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('🔓 Channel Unlocked')
                    .setDescription(`${channel} has been automatically unlocked after ${durationMinutes} minute(s).`);
                const logChannel = logChannelId ? await channel.guild.channels.fetch(logChannelId).catch(() => null) : null;
                if (logChannel) await logChannel.send({ embeds: [logEmbed] });
            } catch (error) {
                console.error('Auto-unlock failed:', error);
            }
            lockdownTimers.delete(channel.id);
        }, durationMinutes * 60 * 1000);
        lockdownTimers.set(channel.id, timer);
    }

    return {
        embed: new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('🔒 Channel Locked')
            .setDescription(`${channel} has been locked${durationMinutes > 0 ? ` for ${durationMinutes} minute(s)` : ''}.`)
            .addFields(
                { name: 'Locked By', value: executor.tag, inline: true },
                { name: 'Duration', value: durationMinutes > 0 ? `${durationMinutes} minute(s)` : 'Indefinite', inline: true }
            )
            .setTimestamp()
    };
}

async function unlockChannel(channel, executor = null) {
    if (!channel.permissionsFor(channel.guild.members.me).has(PermissionsBitField.Flags.ManageChannels))
        throw new Error('I don\'t have permission to manage that channel.');

    await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
        SendMessages: null
    });

    if (lockdownTimers.has(channel.id)) {
        clearTimeout(lockdownTimers.get(channel.id));
        lockdownTimers.delete(channel.id);
    }

    const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('🔓 Channel Unlocked')
        .setDescription(`${channel} has been unlocked.`)
        .setTimestamp();
    if (executor) embed.addFields({ name: 'Unlocked By', value: executor.tag, inline: true });
    return { embed };
}

// ========== SLASH COMMAND HANDLERS ==========

async function handleSay(interaction) {
    const msg = interaction.options.getString('message');
    if (!interaction.guild) {
        await interaction.reply({ content: msg });
    } else {
        await interaction.reply({ content: `✅ Saying: "${msg}"`, flags: MessageFlags.Ephemeral });
        await interaction.channel.send(msg);
    }
}

async function handleHowgay(interaction) {
    await interaction.deferReply();
    const target = interaction.options.getUser('user') || interaction.user;
    const percent = Math.floor(Math.random() * 100) + 1;
    const bar = '█'.repeat(Math.round(percent / 5)) + '░'.repeat(20 - Math.round(percent / 5));
    const rainbow = percent > 80 ? '🌈🌈🌈' : percent > 50 ? '🌈🌈' : percent > 20 ? '🌈' : '';
    const embed = new EmbedBuilder()
        .setColor(0xFF69B4)
        .setTitle('Gay Meter 🏳️‍🌈')
        .setDescription(`${target} is **${percent}%** gay!`)
        .addFields(
            { name: 'Gayness Meter', value: `${bar} ${percent}%`, inline: false },
            { name: 'Results', value: `${percent >= 70 ? 'SUPER GAY!' : percent >= 40 ? 'Kinda gay' : 'Not that gay'} ${rainbow}`, inline: false }
        )
        .setThumbnail(target.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: `Test conducted by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();
    await interaction.editReply({ embeds: [embed] });
}

async function handleSafemode(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const current = userSafeMode.get(interaction.user.id) || false;
    const newStatus = !current;
    userSafeMode.set(interaction.user.id, newStatus);

    if (interaction.guild) {
        const publicMsg = newStatus
            ? `${interaction.user.username} is now in safe mode.`
            : `${interaction.user.username} is no longer in safe mode.`;
        await interaction.channel.send(publicMsg).catch(() => {});
    }

    const embed = new EmbedBuilder()
        .setColor(newStatus ? 0x00FF00 : 0xFF0000)
        .setTitle('🔒 Safe Mode')
        .setDescription(`Your safe mode is now **${newStatus ? 'ENABLED' : 'DISABLED'}**`)
        .addFields(
            { name: 'What this does:', value: 'When enabled, YOUR messages will be deleted and reposted as embeds by the bot.', inline: false },
            { name: 'Your Status:', value: newStatus ? '✅ ON - Your messages will be embedded' : '❌ OFF - Your messages stay normal', inline: false },
            { name: 'Note:', value: 'This only affects YOU, not other users.', inline: false }
        )
        .setFooter({ text: `Toggled by ${interaction.user.username}` })
        .setTimestamp();
    await interaction.editReply({ embeds: [embed] });
}

async function handleCheckSafemode(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const status = userSafeMode.get(interaction.user.id) || false;
    const embed = new EmbedBuilder()
        .setColor(status ? 0x00FF00 : 0xFF0000)
        .setTitle('🔒 Your Safe Mode Status')
        .setDescription(`Your safe mode is currently **${status ? 'ENABLED' : 'DISABLED'}**`)
        .addFields(
            { name: 'Status', value: status ? '✅ ON' : '❌ OFF', inline: true },
            { name: 'Effect', value: status ? 'Your messages become embeds' : 'Normal chat', inline: true },
            { name: 'Toggle', value: 'Use `/safemode` to change', inline: false }
        )
        .setFooter({ text: 'This setting only affects you' })
        .setTimestamp();
    await interaction.editReply({ embeds: [embed] });
}

async function handlePing(interaction) {
    await interaction.deferReply();
    const sent = await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle('🏓 Pong!').addFields(
            { name: 'Latency', value: 'Calculating...', inline: true },
            { name: 'API Latency', value: `${Math.round(client.ws.ping)}ms`, inline: true }
        )]
    });
    const pingEmbed = EmbedBuilder.from(sent.embeds[0])
        .setFields(
            { name: 'Latency', value: `${Date.now() - sent.createdTimestamp}ms`, inline: true },
            { name: 'API Latency', value: `${Math.round(client.ws.ping)}ms`, inline: true }
        );
    await interaction.editReply({ embeds: [pingEmbed] });
}

async function handleHelp(interaction) {
    await interaction.deferReply();
    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('🤖 Slash Commands')
        .setDescription('Here are all available commands:')
        .addFields(
            { name: '🛡️ Moderation (Guild only)', value: '`/ban` – Ban a user\n`/kick` – Kick a user\n`/warn` – Warn a user\n`/purge` – Delete messages\n`/lockdown` – Lock a channel\n`/unlockdown` – Unlock a channel', inline: false },
            { name: '⚙️ Configuration', value: '`/prefix` – Change command prefix\n`/log channel` – Set log channel', inline: false },
            { name: '🎉 Fun', value: '`/ping` – Check latency\n`/howgay [user]` – Gay meter\n`/say` – Make the bot say something', inline: true },
            { name: '🔧 Utility', value: '`/safemode` – Toggle embed mode\n`/checksafemode` – Check status\n`/help` – This menu', inline: true }
        )
        .setFooter({ text: `Current prefix for message commands: ${commandPrefix}` })
        .setTimestamp();
    await interaction.editReply({ embeds: [embed] });
}

// Moderation slash handlers
async function handleBan(interaction) {
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    await interaction.deferReply();
    try {
        const result = await banUser(interaction.user, interaction.guild, target, reason);
        await interaction.editReply({ embeds: [result.embed] });
    } catch (error) {
        await interaction.editReply({ content: `❌ ${error.message}`, flags: MessageFlags.Ephemeral });
    }
}

async function handleKick(interaction) {
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    await interaction.deferReply();
    try {
        const result = await kickUser(interaction.user, interaction.guild, target, reason);
        await interaction.editReply({ embeds: [result.embed] });
    } catch (error) {
        await interaction.editReply({ content: `❌ ${error.message}`, flags: MessageFlags.Ephemeral });
    }
}

async function handleWarn(interaction) {
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    try {
        const result = await warnUser(interaction.user, interaction.guild, target, reason);
        await interaction.editReply({ embeds: [result.embed] });
    } catch (error) {
        await interaction.editReply({ content: `❌ ${error.message}`, flags: MessageFlags.Ephemeral });
    }
}

async function handlePurge(interaction) {
    const amount = interaction.options.getInteger('amount');
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    try {
        const result = await purgeMessages(interaction.channel, amount);
        await interaction.editReply({ content: `✅ Deleted ${result.count} messages.` });
    } catch (error) {
        await interaction.editReply({ content: `❌ ${error.message}`, flags: MessageFlags.Ephemeral });
    }
}

async function handleLockdown(interaction) {
    const channel = interaction.options.getChannel('channel');
    const duration = interaction.options.getInteger('duration');
    await interaction.deferReply();
    try {
        const result = await lockdownChannel(channel, duration, interaction.user);
        await interaction.editReply({ embeds: [result.embed] });
    } catch (error) {
        await interaction.editReply({ content: `❌ ${error.message}`, flags: MessageFlags.Ephemeral });
    }
}

async function handleUnlockdown(interaction) {
    const channel = interaction.options.getChannel('channel');
    await interaction.deferReply();
    try {
        const result = await unlockChannel(channel, interaction.user);
        await interaction.editReply({ embeds: [result.embed] });
    } catch (error) {
        await interaction.editReply({ content: `❌ ${error.message}`, flags: MessageFlags.Ephemeral });
    }
}

async function handlePrefix(interaction) {
    const newPrefix = interaction.options.getString('new_prefix');
    if (newPrefix.length > 5) {
        return interaction.reply({ content: '❌ Prefix must be 5 characters or less.', flags: MessageFlags.Ephemeral });
    }
    commandPrefix = newPrefix;
    await interaction.reply({ content: `✅ Command prefix changed to \`${newPrefix}\``, flags: MessageFlags.Ephemeral });
}

async function handleLog(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'channel') {
        const channel = interaction.options.getChannel('channel');
        if (!channel.isTextBased()) {
            return interaction.reply({ content: '❌ Please select a text channel.', flags: MessageFlags.Ephemeral });
        }
        logChannelId = channel.id;
        await interaction.reply({ content: `✅ Log channel set to ${channel}.`, flags: MessageFlags.Ephemeral });
    }
}

// ========== PREFIX COMMAND HANDLERS ==========

async function prefixBan(message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers))
        return message.reply('❌ You don\'t have permission to ban members.');
    const user = message.mentions.users.first();
    if (!user) return message.reply('❌ Please mention a user to ban.');
    const reason = args.slice(1).join(' ') || 'No reason provided';
    try {
        const result = await banUser(message.author, message.guild, user, reason);
        await message.channel.send({ embeds: [result.embed] });
    } catch (error) {
        await message.reply(`❌ ${error.message}`);
    }
}

async function prefixKick(message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers))
        return message.reply('❌ You don\'t have permission to kick members.');
    const user = message.mentions.users.first();
    if (!user) return message.reply('❌ Please mention a user to kick.');
    const reason = args.slice(1).join(' ') || 'No reason provided';
    try {
        const result = await kickUser(message.author, message.guild, user, reason);
        await message.channel.send({ embeds: [result.embed] });
    } catch (error) {
        await message.reply(`❌ ${error.message}`);
    }
}

async function prefixWarn(message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers))
        return message.reply('❌ You don\'t have permission to warn members.');
    const user = message.mentions.users.first();
    if (!user) return message.reply('❌ Please mention a user to warn.');
    const reason = args.slice(1).join(' ');
    if (!reason) return message.reply('❌ Please provide a reason.');
    try {
        const result = await warnUser(message.author, message.guild, user, reason);
        await message.channel.send({ embeds: [result.embed] });
    } catch (error) {
        await message.reply(`❌ ${error.message}`);
    }
}

async function prefixPurge(message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
        return message.reply('❌ You don\'t have permission to manage messages.');
    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount < 1 || amount > 100)
        return message.reply('❌ Please provide a number between 1 and 100.');
    try {
        const result = await purgeMessages(message.channel, amount);
        const reply = await message.channel.send(`✅ Deleted ${result.count} messages.`);
        setTimeout(() => reply.delete().catch(() => {}), 3000);
    } catch (error) {
        await message.reply(`❌ ${error.message}`);
    }
}

async function prefixLockdown(message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels))
        return message.reply('❌ You don\'t have permission to manage channels.');
    const channel = message.mentions.channels.first() || message.channel;
    const duration = parseInt(args[1]) || 0;
    if (args[1] && (isNaN(duration) || duration < 0))
        return message.reply('❌ Duration must be a positive number (minutes).');
    try {
        const result = await lockdownChannel(channel, duration, message.author);
        await message.channel.send({ embeds: [result.embed] });
    } catch (error) {
        await message.reply(`❌ ${error.message}`);
    }
}

async function prefixUnlockdown(message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels))
        return message.reply('❌ You don\'t have permission to manage channels.');
    const channel = message.mentions.channels.first() || message.channel;
    try {
        const result = await unlockChannel(channel, message.author);
        await message.channel.send({ embeds: [result.embed] });
    } catch (error) {
        await message.reply(`❌ ${error.message}`);
    }
}

async function prefixChangePrefix(message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
        return message.reply('❌ Only administrators can change the prefix.');
    const newPrefix = args[0];
    if (!newPrefix) return message.reply('❌ Please provide a new prefix.');
    if (newPrefix.length > 5) return message.reply('❌ Prefix must be 5 characters or less.');
    commandPrefix = newPrefix;
    await message.reply(`✅ Command prefix changed to \`${newPrefix}\``);
}

async function prefixLog(message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
        return message.reply('❌ Only administrators can set the log channel.');
    const sub = args[0]?.toLowerCase();
    if (sub === 'channel') {
        const channel = message.mentions.channels.first();
        if (!channel) return message.reply('❌ Please mention a channel.');
        if (!channel.isTextBased()) return message.reply('❌ Please select a text channel.');
        logChannelId = channel.id;
        await message.reply(`✅ Log channel set to ${channel}.`);
    } else {
        await message.reply('❌ Usage: `log channel #channel`');
    }
}

// ========== LOGIN ==========
client.login(process.env.TOKEN);
