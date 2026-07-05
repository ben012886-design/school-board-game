# The Board Member: Stay in Your Lane - v1.2 Vercel Update

This is a drop-in Vercel/OpenAI update for the School Board Member game.

## What this update includes

- Static frontend files:
  - `index.html`
  - `styles.css`
  - `script.js`
- Vercel serverless API route:
  - `api/game-turn.js`
- No OpenAI API key in browser code.
- Server route reads the key only from `process.env.OPENAI_API_KEY`.
- Default model is `gpt-4o-mini`.
- Optional override: set `OPENAI_MODEL` in Vercel if you later want a different model.
- MVP flow from the v1.2 Game Bible:
  - Title/setup screen
  - Constituent, location, attitude selectors
  - Choose For Me randomizer
  - Scene section
  - One named constituent dialogue card
  - Free-response player input
  - Per-turn scoring
  - Public Trust Meter
  - Final summary screen
  - Footer copyright

## Important v1.2 UI fixes included

- The constituent's quote appears once in a named speaker card.
- There is no duplicate generic `Constituent` quote section.
- The player response placeholder is exactly:

```text
Type your response here.
```

## File replacement plan

Because you already have a PROD item in GitHub/Vercel, treat this as a file update rather than a new project.

### Replace or add these files in your existing GitHub repo

At the root of the repo:

```text
index.html
styles.css
script.js
package.json
vercel.json
.gitignore
README_UPDATE.md
```

Inside the existing `api` folder:

```text
api/game-turn.js
```

If your current project already has files with these names, replace them with these versions.

## GitHub update steps - browser method

1. Open your GitHub repo for the existing Vercel project.
2. Upload or edit the files listed above.
3. Make sure `api/game-turn.js` is inside an `api` folder at the root of the repo.
4. Commit the changes to the branch connected to Vercel production, usually `main`.
5. Use a commit message like:

```text
Update School Board game to v1.2
```

## GitHub update steps - local computer method

From your local repo folder:

```bash
git checkout main
git pull
```

Copy the new files into the repo, then run:

```bash
git status
git add index.html styles.css script.js package.json vercel.json .gitignore README_UPDATE.md api/game-turn.js
git commit -m "Update School Board game to v1.2"
git push
```

## Vercel steps

1. Go to the Vercel project that is already connected to this GitHub repo.
2. Open **Settings > Environment Variables**.
3. Confirm this variable exists for Production:

```text
OPENAI_API_KEY
```

4. Its value must be your full OpenAI API key, not a shortened preview with an ellipsis.
5. Optional: add this only if you want to override the default model:

```text
OPENAI_MODEL=gpt-4o-mini
```

6. After GitHub receives your commit, Vercel should automatically deploy.
7. Open **Deployments** in Vercel and confirm the newest deployment finishes successfully.
8. Visit the production URL and test:
   - Start Game
   - Submit one answer
   - Confirm the Public Trust Meter updates
   - Confirm the named constituent reply appears once
   - Confirm the text box placeholder is only `Type your response here.`

## If Vercel does not auto-deploy

1. Go to your Vercel project.
2. Open **Deployments**.
3. Click the latest deployment menu.
4. Choose **Redeploy**.

## Troubleshooting

### `OPENAI_API_KEY is not configured`

The key is missing in Vercel, or it is not enabled for the Production environment.

### `You exceeded your current quota`

The code is working, but the OpenAI account/billing/quota is blocking the request. Add billing funds or check usage limits in the OpenAI platform.

### A 404 on `/api/game-turn`

Make sure `game-turn.js` is located here:

```text
api/game-turn.js
```

The `api` folder must be at the root of the repo.

### The frontend loads but nothing happens after Start Game

Open Vercel **Functions** logs for `api/game-turn.js`. The most likely causes are a missing environment variable, quota error, or malformed file path.
