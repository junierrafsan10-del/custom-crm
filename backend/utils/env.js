const REQUIRED_VARS = ['MONGODB_URI', 'JWT_SECRET'];

const OPTIONAL_VARS = {
  PORT: { default: '5000', parse: Number },
  FRONTEND_URL: { default: 'http://localhost:5173' },
  FB_APP_ID: { default: '' },
  FB_APP_SECRET: { default: '' },
  NODE_ENV: { default: 'development' },
  MAX_LOGIN_ATTEMPTS: { default: '5', parse: Number },
  ACCOUNT_LOCKOUT_MINUTES: { default: '15', parse: Number },
  UPLOAD_MAX_BYTES: { default: '5242880', parse: Number },
  JWT_EXPIRY: { default: '7d' },
  BODY_LIMIT: { default: '1mb' }
};

function validateEnv() {
  const missing = REQUIRED_VARS.filter(v => !process.env[v]);
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    console.error('Create a .env file in the backend/ directory. See .env.example for reference.');
    process.exit(1);
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.error('JWT_SECRET must be at least 32 characters long for production security.');
    process.exit(1);
  }

  const isPlaceholder = process.env.JWT_SECRET && (
    process.env.JWT_SECRET.includes('replace_this') ||
    process.env.JWT_SECRET === 'your-secret-key' ||
    process.env.JWT_SECRET === 'change-me'
  );
  if (isPlaceholder) {
    console.error('JWT_SECRET is still set to a placeholder value. Generate a strong random secret.');
    console.error('You can run: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
    process.exit(1);
  }

  const cfg = {};
  for (const key of REQUIRED_VARS) {
    cfg[key] = process.env[key];
  }
  for (const [key, opts] of Object.entries(OPTIONAL_VARS)) {
    const val = process.env[key] !== undefined ? process.env[key] : opts.default;
    cfg[key] = opts.parse ? opts.parse(val) : val;
  }

  return cfg;
}

const config = validateEnv();

module.exports = config;
