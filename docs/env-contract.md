# Environment Contract

## API (`apps/api/.env`)

- `NODE_ENV`: runtime mode (`development`, `test`, `production`).
- `PORT`: API listen port.
- `API_BASE_PATH`: API prefix, default `/api/v1`.
- `MONGO_URI`: MongoDB connection string.
- `JWT_ACCESS_SECRET`: secret for access token signing.
- `JWT_REFRESH_SECRET`: secret for refresh token signing.
- `JWT_ACCESS_TTL`: short access token duration.
- `JWT_REFRESH_TTL`: longer refresh token duration.
- `CORS_ORIGIN_STORE`: allowed storefront origin.
- `CORS_ORIGIN_ADMIN`: allowed admin dashboard origin.
- `RATE_LIMIT_WINDOW_MS`: limiter window duration.
- `RATE_LIMIT_MAX`: max requests per window per IP.
- `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name.
- `CLOUDINARY_API_KEY`: Cloudinary API key.
- `CLOUDINARY_API_SECRET`: Cloudinary API secret.
- `CLOUDINARY_FOLDER`: upload folder path prefix.
- `PAYMENT_PROVIDER`: active provider adapter name.
- `PAYMENT_API_KEY`: payment provider API key.
- `PAYMENT_WEBHOOK_SECRET`: signature verification secret for webhooks.
- `PAYMENT_CALLBACK_URL`: backend webhook endpoint.
- `PAYMENT_SUCCESS_URL`: client redirect URL after successful payment.
- `PAYMENT_CANCEL_URL`: client redirect URL after canceled payment.

## Storefront (`apps/storefront/.env`)

- `VITE_API_URL`: API base URL for customer app.

## Admin (`apps/admin/.env`)

- `VITE_API_URL`: API base URL for admin app.

## Production Notes

- Keep all secrets in deployment secret manager.
- Never commit real `.env` files.
- Use different secrets/keys for each environment.
