# conheca-share

/skill:migrate-external-project Source: code archive. Migrate the attached project into Lovable.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9852eaf3-e698-4c7e-b17f-a4a3da9f18b5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Quiz e leads no Cloudflare D1

Configuração completa, consultas e validação: [docs/quiz-d1.md](docs/quiz-d1.md).

Prompt de ativação para o ambiente com acesso ao D1: [docs/prompt-quiz-d1.md](docs/prompt-quiz-d1.md).

O quiz v3 usa o backend existente `api.share-brasil.com`, com `SHARE_DB`. A captura exige aplicar a migração nova e configurar `QUIZ_HASH_SECRET` nesse Worker. O serviço separado é uma alternativa.
