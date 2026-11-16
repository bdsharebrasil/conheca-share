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

- The home markup is in src/site-body.ts. The route imports bundled modules directly and owns their setup/cleanup in useEffect. Never append runtime script tags or add global singleton guards.
- Site composition, contact and reading progress are in src/site/interactions.js; service tabs are in src/site/services.js. Portal UI, calculations and neutral aircraft label are in src/portal/. Never persist contact details in browser storage.
- Source styles live in src/styles/ and are imported by the home route; public/ contains static assets only. Keep portal styling scoped to .demo-shell in src/styles/portal-demo.css. The quiz uses the dark blue-grey conversation-card palette, with #c1ec42 for actions, focus and selected options.
- Quiz UI and commercial rules are in src/quiz/quiz.js and src/quiz/model.js. iniciarQuiz returns a cleanup function. React calls it on unmount, including development StrictMode remounts; no document-level mounting events are needed.
- Lead capture primarily uses backend-share/src/quizRoutes.ts with SHARE_DB. src/quiz/server/worker.js is the standalone alternative using DB; its config and SQL history remain in cloudflare/quiz/. The v3 additive schema creates quiz_participacoes and quiz_eventos; do not rebuild historical leads_quiz. See docs/quiz-d1.md and docs/prompt-quiz-d1.md. These are D1 files, not Lovable-managed Supabase/Drizzle migrations. Recalculate recommendations server-side. Never claim a lead is saved before API confirmation.
- Aircraft weights and passenger ranges are commercial screening settings, not certified fleet performance. Confirm them with Share before campaigns. Only expired technical counters are automatically deleted; do not add automatic lead deletion without a retention policy from Share.
- The v3 quiz covers seven models, shares its calculation with backend-share/src/quiz/modelo.js, records optional/anonymous contact, and treats explicitly essential pressurization as a hard filter. Preserve the R2 photo for the actual result; never substitute another model on image failure.
- Public copy must focus on gestão de cotas, administração de cotas and gestão privada de aeronaves. Apply this to headings, metadata, quiz results, simulator labels, downloads and WhatsApp messages. Preserve the commercial rules and optional contact flow.
- The opening has a single viewport-height hero with the original full sky photo. src/site/story-motion.ts maps scroll directly to its exit in src/styles/cinema.css. The actual A Share section follows immediately in normal flow, rising as the hero leaves. Do not reintroduce pinned multi-screen chapters, intermediate blank/paper panels or spacer heights. No autoplay, wheel/touch interception or time-based smoothing. Preserve 30%/60%/reverse tests; reduced motion disables exit transforms/fades.
- Never apply continuous motion to quiz forms, portal tables or finance. The quiz uses visual choices and a live preference summary, without revealing a model before the final recommendation. The portal demo must be visible by default in section 04, without details/summary or an expand-to-start gate.
