export default () => ({
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT || 5432,
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASS: process.env.DB_PASS || 'postgres',
  DB_NAME: process.env.DB_NAME || 'auth_db',
  JWT_SECRET: process.env.JWT_SECRET || 'change_this_secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '3600s',
  NODE_ENV: process.env.NODE_ENV || 'development'
});
