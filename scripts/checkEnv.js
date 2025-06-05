const required = [
  "DATABASE_URL",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "EBAY_APP_ID",
  "EBAY_USER_TOKEN",
  "ISBNDB_API_KEY"
];

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error("❌ Missing required env vars:", missing.join(", "));
  process.exit(1);
} else {
  console.log("✅ Environment is fully configured.");
}
