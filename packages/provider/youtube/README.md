# @apicity/youtube

YouTube Data API v3 provider for posting content.

## Installation

```bash
npm install @apicity/youtube
```

## Usage

```typescript
import { youtube } from "@apicity/youtube";

const yt = youtube({ accessToken: "YOUR_OAUTH_TOKEN" });
```

## Authentication

YouTube Data API v3 requires an OAuth 2.0 access token with the appropriate
scopes. Obtain a token via the Google OAuth 2.0 flow and pass it as
`accessToken`.

Required scopes for write operations:
- `https://www.googleapis.com/auth/youtube.upload`
- `https://www.googleapis.com/auth/youtube.force-ssl`

## License

MIT
