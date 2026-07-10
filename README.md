# The Board Member: Stay in Your Lane — Vercel PROD Update

This package is a drop-in Vercel/OpenAI MVP update for the existing PROD game.

## Files included

- `index.html` — static frontend shell
- `styles.css` — responsive styling
- `script.js` — browser gameplay logic; does **not** contain the OpenAI API key
- `api/game-turn.js` — Vercel serverless API route; reads `OPENAI_API_KEY` from Vercel environment variables only
- `package.json` — minimal Node/Vercel project metadata
- `vercel.json` — sets serverless function max duration

## Important security rule

Do not paste your OpenAI API key into any frontend file. The only place it belongs is:

Vercel → Project → Settings → Environment Variables → `OPENAI_API_KEY`

## Recommended update flow

1. Open your existing GitHub repository for the PROD game.
2. Replace the existing frontend files with this package's files:
   - `index.html`
   - `styles.css`
   - `script.js`
3. Replace or add the serverless API file:
   - `api/game-turn.js`
4. Replace or add:
   - `package.json`
   - `vercel.json`
5. Commit the changes to your production branch, usually `main`.
6. Vercel should automatically create a new Production Deployment if the project is connected to GitHub and `main` is the production branch.
7. In Vercel, confirm that `OPENAI_API_KEY` exists for Production.
8. Test the production URL:
   - Start a scenario.
   - Submit one response.
   - Confirm the Public Trust Meter appears after the Scene and before the constituent reply.
   - Confirm the Last Response Score appears after the constituent reply.

## If the site errors

Check Vercel → Project → Logs → the latest deployment/function log for `api/game-turn.js`.

Common causes:

- `OPENAI_API_KEY` missing from Production environment variables.
- OpenAI account quota or billing issue.
- The Vercel project is pointed at a different Git branch than the one you updated.

If you update or add an environment variable, redeploy the project so the new deployment receives the value.
