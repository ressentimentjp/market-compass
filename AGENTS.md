# Working agreements for Market Compass

- UI and explanations should be in Japanese.
- Preserve provenance: market facts need a source, a date, and any known uncertainty.
- Never synthesize user reviews or claim market demand/size from GitHub stars, HN posts, or App Store search counts.
- Keep each UI screen mobile responsive (375px+), keyboard accessible when reasonable.
- Do not expose API keys in client-side JavaScript; move authenticated APIs behind a secure backend.
- Test modified JavaScript with `node --check`; test browser UI and download flows when possible.
- Cloud data sync, public release, paid APIs, commits, PR merges, payment activity, and spending require user approval.
- Report what was actually tested and what remains unverified.
