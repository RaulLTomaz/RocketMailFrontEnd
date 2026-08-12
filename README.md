# RocketMail

Aplicação social inspirada em redes de microblogging (clone de X), com frontend mobile/web em React Native + Expo e API Django REST.

## Funcionalidades

* Cadastro e login
* Perfil (próprio e de terceiros)
* Alteração de foto, nome e senha
* Criação e exclusão de posts
* Feed de usuários seguidos
* Explorar posts e buscar usuários
* Seguir e deixar de seguir
* Lista de seguidores e de seguidos (perfil próprio)
* Curtidas em posts
* Comentários em posts (listar, criar e excluir o próprio)
* Tema claro/escuro

## Tecnologias

* React Native / Expo
* TypeScript
* React Navigation
* Axios
* Jest + Testing Library
* Backend Django REST

## Deploy

https://rocket-mail-site.vercel.app

## Backend

https://github.com/RaulLTomaz/RocketMailBackEndDjango

API em produção: `https://rocketmail-django.onrender.com`  
Health check: `GET /healthz`

A URL da API está fixa no código (`src/config/api.ts` e `app.config.ts`) para o deploy web não herdar env desatualizada.

## Instalação

**Requisitos:** Node.js 20+ e npm.

```bash
git clone https://github.com/RaulLTomaz/RocketMailFrontEnd
cd RocketMailFrontEnd
npm install
```

Opcional — copie o exemplo de env (referência local; o client Axios usa a URL Django do código):

```bash
cp .env.example .env
```

## Variáveis de ambiente

Nomes documentados (não obrigatórios para o client atual):

* `API_URL`
* `EXPO_PUBLIC_API_URL`

Não coloque secrets no frontend. O `.env` local está no `.gitignore`; use `.env.example` como modelo.

## Execução

```bash
npx expo start
# ou web:
npm run web
```

Abra http://localhost:8081

## Testes

```bash
npm run test:unit
npm run test:integration
```

## Deploy (Vercel)

| Campo | Valor |
|--------|--------|
| Install | `npm install` |
| Build | `npx expo export -p web` |
| Output | `dist` |

## Limitações

* Backend no Render free pode hibernar (primeira request mais lenta)
* Token na web fica em AsyncStorage (SecureStore só no native)
* Endpoints `/seguir/seguidores` e `/seguir/seguidos` listam apenas as conexões do usuário autenticado

## Autor

Raul Lopes Tomaz

LinkedIn: https://www.linkedin.com/in/raul-lopes-tomaz-aa56a5267/
