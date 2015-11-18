'use strict';

module.exports = {
    port: process.env.PORT || 8000,
    db: {
        host: 'localhost',
        port: '5432',
        database: 'authenticate',
        username: 'postgres',
        password: '1',
        dialect: 'postgres',
        logging: false
    },
    redis: {
        host: 'localhost',
        port: '6379',
        type : 'fakeredis'
    },
    facebook: {
        clientID: process.env.FACEBOOK_ID || 'APP_ID',
        clientSecret: process.env.FACEBOOK_SECRET || 'APP_SECRET',
        callbackURL: '/auth/facebook/callback'
    },
    google: {
        clientID: process.env.GOOGLE_ID || 'CONSUMER_KEY',
        clientSecret: process.env.GOOGLE_SECRET || 'CONSUMER_SECRET',
        callbackURL: 'http://techmaster.vn/auth/google/callback'
    },
    mailer: {
        from: process.env.MAILER_FROM || 'MAILER_FROM',
        options: {
            service: process.env.MAILER_SERVICE_PROVIDER || 'MAILER_SERVICE_PROVIDER',
            auth: {
                user: process.env.MAILER_EMAIL_ID || 'MAILER_EMAIL_ID',
                pass: process.env.MAILER_PASSWORD || 'MAILER_PASSWORD'
            }
        }
    }
};
