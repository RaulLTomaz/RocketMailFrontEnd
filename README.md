# RocketMail FrontEnd

Frontend mobile/web do RocketMail (clone de X), feito com React Native + Expo.

## Features

* Autenticação JWT (cadastro, login, sessão persistente)
* Feed paginado, composição de posts e curtidas em batch
* Busca de usuários com debounce
* Perfil próprio e de terceiros (seguir, editar, foto, excluir conta)
* Tema claro/escuro

## Tecnologias

* React Native / Expo
* React Navigation
* Axios (API Django)
* Jest + Testing Library

## Backend

API Django no Render:

```
https://rocketmail-django.onrender.com
```

Health check: `GET /healthz`

A URL da API está **fixa no código** (`src/config/api.ts` e `app.config.ts`) para o deploy web não herdar env desatualizada. Arquivos `.env` são opcionais e só úteis para referência local — o client Axios usa a constante Django.

## Instalação

```bash
git clone https://github.com/RaulLTomaz/RocketMailFrontEnd
cd RocketMailFrontEnd
npm install
```

## Rodar local

```bash
npx expo start
# ou web:
npm run web
```

Abra http://localhost:8081

## Deploy (Vercel)

| Campo | Valor |
|--------|--------|
| Install | `npm install` |
| Build | `npx expo export -p web` |
| Output | `dist` |

Após alterar a API no código, faça **push + redeploy**.

## Decisões técnicas

* Auth: form `username`/`password` no login (contrato Django) + Bearer JWT
* Likes enriquecidos no client via `GET /like/batch` (`attachLikes`)
* Warm-up `GET /healthz` para cold start do Render (plano free)

## Limitações

* Backend no Render free pode hibernar (primeira request mais lenta)
* Token na web fica em AsyncStorage (SecureStore só no native)

## Testes

```bash
npm run test:unit
npm run test:integration
```

A integração bate em `https://rocketmail-django.onrender.com`.

## Autor

Raul Lopes Tomaz

LinkedIn: https://www.linkedin.com/in/raul-lopes-tomaz-aa56a5267/
