# RocketMail FrontEnd

Mobile frontend application for RocketMail, a social platform inspired by Twitter/X, developed with React Native.

## 🚀 Technologies

* React Native
* JavaScript
* Expo
* REST API Integration
* React Navigation
* Git

## 📌 Features

* User authentication interface
* Feed visualization
* Mobile-first interface
* API integration with Django backend
* Responsive mobile navigation
* Modular component structure

## 🧠 Project Purpose

RocketMail was created as a practical mobile development and full-stack integration project focused on React Native application architecture and API communication.

The project aims to improve hands-on experience with mobile development, backend integration, and scalable application structure.

## ⚙️ Installation

Clone the repository:

```bash
git clone https://github.com/RaulLTomaz/RocketMailFrontEnd
```

Install dependencies:

```bash
npm install
```

Start the project:

```bash
npx expo start
```

## 🔗 Backend

API (Django, Render):
https://rocketmail-django.onrender.com

Health check: `GET /healthz`

No Vercel, defina (ou remova a URL antiga do FastAPI):

```
API_URL=https://rocketmail-django.onrender.com
EXPO_PUBLIC_API_URL=https://rocketmail-django.onrender.com
```

O app **ignora** `rocketmail-api.onrender.com` mesmo se ainda estiver na env do deploy.


## 👨‍💻 Author

Raul Lopes Tomaz

LinkedIn:
https://www.linkedin.com/in/raul-lopes-tomaz-aa56a5267/
