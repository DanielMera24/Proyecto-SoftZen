import dotenv from 'dotenv';
dotenv.config();

const environments = {
  development: {
    port: process.env.PORT || 3001,
    nodeEnv: 'development',
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 100
    },
    db: {
      filename: './database/softzen.db'
    }
  },
  production: {
    port: process.env.PORT || 3001,
    nodeEnv: 'production',
    cors: {
      origin: process.env.FRONTEND_URL || 'https://softzen.com',
      credentials: true
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 50
    },
    db: {
      filename: './database/softzen.db'
    }
  },
  test: {
    port: 3002,
    nodeEnv: 'test',
    cors: {
      origin: '*',
      credentials: true
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 1000
    },
    db: {
      filename: ':memory:'
    }
  }
};

const currentEnv = process.env.NODE_ENV || 'development';

export default environments[currentEnv];
