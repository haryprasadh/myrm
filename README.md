# MyRM: a private relationship manager for HDFC Bank customers

**Unofficial.** MyRM is an independent open-source tool. It is not affiliated with, endorsed by or connected to HDFC Bank Ltd.

One place for your HDFC cards, PINs, due dates, loans, FDs and spending. Everything stays **encrypted on your own device**. There are no servers, no accounts and no tracking.

**Open the app:** https://haryprasadh.github.io/myrm/ (then *Add to Home Screen* to install it).

## What it does

| | |
|---|---|
| 🔐 **Vault** | Card PINs, UPI PINs (per app), app MPIN, NetBanking Customer ID and password. Save the secret itself or only a memory hint. |
| 💳 **Cards** | Statement and due dates, fee-waiver progress, rewards and caps, and a "which card should I use?" picker. |
| 📅 **Never miss a due** | Card bills, EMIs and FD maturities in one list. Export them to Google or Apple Calendar. |
| 📊 **Money** | Import a NetBanking statement (Delimited/CSV, or PDF in beta). Files are read on your device. You get spending by category, top merchants and net worth. |
| 🧮 **Tools** | EMI and prepayment savings, FD/RD maturity, an FD ladder, and Classic / Preferred / Imperia tier tracking. |
| 🆘 **Help** | Steps for a lost card, official helplines and links, and a checker for "is this link or SMS a scam?". Works even while the app is locked. |

## Security model

- **Encryption:** all data is encrypted with AES-256-GCM. The key is random, and it is wrapped by your passphrase (via Argon2id, 64 MiB) or by a device passkey (Face ID or fingerprint, via WebAuthn PRF).
- **Secrets encrypted twice:** PINs, passwords and card numbers are encrypted a second time. They are decrypted only when you tap Reveal or Copy, then re-hidden after 10 s. Copied secrets are cleared from the clipboard afterwards.
- **No network requests:** MyRM makes none, and its Content-Security-Policy (`connect-src 'self'`) blocks background requests to other sites. There is no analytics and nothing is loaded from a third party. Like any web app, it is only as safe as the code you run, so check the published hashes (below) or run your own copy.
- **Auto-lock:** the app locks after a period of inactivity and 1 minute after you switch away. Only one tab can be unlocked at a time.
- **Passphrase change rotates the key:** the data key is replaced and every secret re-encrypted, so old copies of the vault can't read anything saved afterwards.
- **Never collected:** OTPs and CVVs. Anyone asking you for them is a fraudster.
- **Verifiable deploys:** every deploy publishes `SHA256SUMS.txt`, so you can check that the live files match the CI build of this code.

**Limits, honestly:**
- A weak passphrase can be guessed if someone steals your device's data, so use 4 or more random words.
- Malware on your phone can read anything you can see.
- HDFC Bank and RBI advise against writing PINs down. Use **hint mode** if you prefer.
- There is no passphrase recovery. Export encrypted backups regularly.

## Run your own copy

```bash
npm ci
npm run dev      # local dev server
npm run check    # typecheck + tests + production build
```

Fork the repo and enable GitHub Pages (Source: GitHub Actions). The included workflow tests, builds and deploys it.

## Data and accuracy

Bank facts (links, helplines, FD rates, card features) live in `src/data/`. Each fact records its source and a last-verified date. Banks change rules often, so always confirm on the bank's official site. Pull requests that update the data with sources are welcome.

MIT licensed.
