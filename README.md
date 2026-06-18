# The Board Member: Stay in Your Lane - Prototype

A small Vercel/OpenAI prototype based on Game Bible v1.1.

## Files

- `index.html` - Main browser UI.
- `styles.css` - Visual styling.
- `script.js` - Frontend state, setup choices, randomizer, and API calls.
- `api/game-turn.js` - Vercel serverless route that calls OpenAI. The API key is read only from `OPENAI_API_KEY`.
- `package.json` - Minimal project metadata.

## Vercel setup

Add this environment variable in Vercel:

`OPENAI_API_KEY=your_key_here`

Do not put the API key in frontend code.

## Local run

Install Vercel CLI if needed:

`npm i -g vercel`

Then run:

`vercel dev`

Open the local URL Vercel provides.

## Notes

This prototype emphasizes:

- Clear scenario openings with separated Scene and Constituent sections.
- Spoken constituent dialogue in quotation marks.
- Free text player responses only.
- Constituent replies that remember what the player said.
- Per-turn scoring and final summary.

© 2026 Ben Phillip. All rights reserved.
