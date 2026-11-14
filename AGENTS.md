<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- The home page is the original static Share Brasil site ported verbatim: markup in src/site-body.ts, styles/scripts in public/ (site.css, app.js, model.js). Why: preserves the vanilla-JS interactions exactly.
- Keep booking presentation helpers in public/booking-view.js and use only a neutral aircraft label in the public illustration; this separates the real-page visual adaptation from the original demo's reservation rules.
- Scope real-portal styling to .demo-shell in public/portal-demo.css; this preserves the surrounding site's design and keeps uploaded customer screenshots reference-only.
- The aircraft quiz is in public/quiz-model.js (shared commercial rules), public/quiz.js (UI), public/quiz.css, and src/site-body.ts. It mounts through share:quiz:iniciar/limpar events so cached modules work after route remounts. Never persist contact details in browser storage.
- Lead capture primarily uses backend-share/src/quizRoutes.ts with SHARE_DB. cloudflare/quiz/worker.js is the standalone alternative using DB. The v3 additive schema creates quiz_participacoes and quiz_eventos; do not rebuild historical leads_quiz. See docs/quiz-d1.md and docs/prompt-quiz-d1.md. These are D1 files, not Lovable-managed Supabase/Drizzle migrations. Client-supplied rankings must never be trusted; calculate recommendations server-side. Do not claim a lead is saved before API confirmation.
- Aircraft weights and passenger ranges are commercial screening settings, not certified fleet performance. Confirm them with Share before campaigns. Only expired technical counters are automatically deleted; do not add automatic lead deletion without a retention policy from Share.

- The v3 quiz covers seven models, shares its calculation with backend-share/src/quiz/modelo.js, records optional/anonymous contact, and treats explicitly essential pressurization as a hard filter. Preserve the R2 photo for the actual result; never substitute another model on image failure.
