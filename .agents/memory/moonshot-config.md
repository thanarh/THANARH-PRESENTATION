---
name: Moonshot AI Configuration
description: Moonshot API endpoint and secret key name for the WhatsApp AI assistant
---

# Moonshot AI Configuration

## Rule
- API base URL: `https://api.moonshot.ai/v1` (NOT `.cn`)
- Secret name in Replit: `MOONSHOTAI_API_KEY`
- Code reads `MOONSHOTAI_API_KEY` first, falls back to `MOONSHOT_API_KEY`
- Model: `moonshot-v1-8k`
- Console: platform.moonshot.ai/console

**Why:** User confirmed the correct platform is moonshot.ai (not moonshot.cn). Secret was saved as MOONSHOTAI_API_KEY.

**How to apply:** Any time Moonshot API is called, use these values. Do not revert to `.cn` or the old key name.
