import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export abstract class BaseCommand {
    abstract name: string;
    abstract description: string;
    abstract build(): SlashCommandBuilder;
    abstract execute(interaction: ChatInputCommandInteraction): Promise<void>;
}