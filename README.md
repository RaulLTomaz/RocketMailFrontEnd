# RocketMail FrontEnd

Frontend mobile/web do RocketMail (clone de X), feito com React Native + Expo.

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

O app usa **somente** essa API. A API FastAPI antiga (`rocketmail-api`) foi descontinuada.

## Instalação

```bash
git clone https://github.com/RaulLTomaz/RocketMailFrontEnd
cd RocketMailFrontEnd
npm install
```

Copie o exemplo de env (opcional — a URL Django já está no código):

```bash
cp .env.example .env
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

Env no Vercel (também definidas em `vercel.json`):

```
API_URL=https://rocketmail-django.onrender.com
EXPO_PUBLIC_API_URL=https://rocketmail-django.onrender.com
```

Após alterar a API, faça **push + redeploy** (o bundle antigo ainda aponta para a URL errada).

## Testes

```bash
npm run test:unit
npm run test:integration
```

A integração bate em `https://rocketmail-django.onrender.com`.

## Autor

Raul Lopes Tomaz

LinkedIn: https://www.linkedin.com/in/raul-lopes-tomaz-aa56a5267/
