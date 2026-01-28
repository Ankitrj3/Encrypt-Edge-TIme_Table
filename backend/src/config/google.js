import { google } from 'googleapis';
import { config } from './env.js';

export const oauth2Client = new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    config.google.redirectUri
);

export const getAuthUrl = () => {
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: config.google.scopes,
        prompt: 'consent'
    });
};

export const getCalendar = () => {
    return google.calendar({ version: 'v3', auth: oauth2Client });
};
