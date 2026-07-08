# Unipd Wallet

> Unipd Wallet is a full-stack project with a visible product surface and supporting service layer.

## The Story

Unipd Wallet starts with a simple goal: keep the product experience and the service layer visible in one place. Its shape tells the same story: the product interface and the service layer live close enough together that a maintainer can see the project as a whole before diving into individual folders.

## What It Includes

- A user-facing surface for the product, demo, dashboard, or static experience.
- A service layer for APIs, realtime behavior, bot logic, or server-side workflows.

## How It Is Put Together

| Path | Role |
| --- | --- |
| `.gitattributes` | project file or folder |
| `Docs` | documentation source |
| `Issuer` | project file or folder |
| `verifier` | project file or folder |
| `wallet` | project file or folder |

## Local Development

```bash
git clone https://github.com/ENZOMOTIVE/unipd-Wallet.git
cd unipd-Wallet
```

```bash
cd Issuer/frontend
npm install
npm start
```

```bash
cd Issuer
npm install
```

```bash
cd verifier/frontend
npm install
npm start
```

```bash
cd verifier
npm install
```

```bash
cd wallet/frontend
npm install
npm start
```

## Command Surface

| Area | Commands |
| --- | --- |
| `Issuer/frontend/package.json` | `start`, `build`, `test`, `eject` |
| `Issuer/package.json` | `test` |
| `verifier/frontend/package.json` | `start`, `build`, `test`, `eject` |
| `verifier/package.json` | `test` |
| `wallet/frontend/package.json` | `start`, `build`, `test`, `eject` |
| `wallet/package.json` | `test` |

## Configuration

- Document API ports, database URLs, third-party credentials, and service endpoints in `.env.example` before deployment.
- Keep wallet private keys, RPC URLs, mnemonics, and contract secrets outside version control.

## Quality Checks

- From `Issuer/frontend`, run `npm test`.
- From `Issuer/frontend`, run `npm run build`.
- From `Issuer`, run `npm test`.
- From `verifier/frontend`, run `npm test`.
- From `verifier/frontend`, run `npm run build`.
- From `verifier`, run `npm test`.
- From `wallet/frontend`, run `npm test`.
- From `wallet/frontend`, run `npm run build`.
- From `wallet`, run `npm test`.

## Where To Take It Next

- Add screenshots or a short user flow so visitors can see the interface before running it.
- Document the main API routes, bot events, or service responsibilities with example inputs and outputs.
- Keep setup commands current whenever dependencies, scripts, or deployment targets change.
- Record important product decisions here so the repository keeps its story as the code evolves.

## Project Metadata

| Field | Details |
| --- | --- |
| Repository | `ENZOMOTIVE/unipd-Wallet` |
| Categories | `Full Stack`, `Protocol` |
| Primary stack | React, Express, Node.js, JavaScript, HTML, CSS |


## License

No license file is currently committed. Add one before distributing this project publicly.
