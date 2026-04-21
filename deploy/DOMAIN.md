# QoldauAI: домен, HTTPS и встраивание виджета

Цель: дашборд доступен по `https://…`, клиенты вставляют скрипт на свои сайты, чат в iframe ходит в ваш API.

## 1. DNS

Пример записей (замените на свой домен):

| Поддомен | Куда смотрит |
|----------|----------------|
| `app` | reverse proxy → порт **3030** (дашборд, внутри уже есть `/api` → бэкенд) |
| `widget` | reverse proxy → порт **3031** (статика виджета + `qoldauai-sdk.js`) |

Вариант без отдельного API-хоста: API только как `https://app.example.com/api` (так проще CORS и сертификаты).

## 2. Переменные при **сборке** фронта и виджета

В Docker образы подхватывают `frontend/.env.docker` и `widget/.env.docker`. Перед `docker compose build` задайте **публичные HTTPS-URL**:

**`frontend/.env.docker`**

```env
REACT_APP_BASE_URL=/api
REACT_APP_QOLDAUAI_WIDGET_URL=https://widget.example.com
REACT_APP_DEMO_CHATBOT_IDS=...
```

**`widget/.env.docker`**

```env
WW_WIDGET_URL=https://widget.example.com
WW_BASE_URL=https://app.example.com/api
```

`WW_BASE_URL` — тот адрес, по которому с браузера пользователя доступен Nest API (часто тот же домен, что и дашборд, с префиксом `/api`).

После правок:

```bash
docker compose build --no-cache qoldauai-dashboard qoldauai-widget
docker compose up -d
```

## 3. Бэкенд: ссылки и CORS

В корневом `.env.docker` (копируется в образ API при сборке) или через переопределение окружения задайте:

```env
CLIENT_URL=https://app.example.com
CORS_ORIGINS=https://app.example.com,https://widget.example.com
OPENAI_KEY=sk-...
```

- **CLIENT_URL** — публичный URL дашборда (письма, редиректы).
- **CORS_ORIGINS** — список через запятую. Если не задан, Nest разрешает отражение `Origin` (как раньше с `*` по смыслу для простых случаев).

Пересоберите API после смены `CLIENT_URL` / ключей:

```bash
docker compose build --no-cache qoldauai-api
docker compose up -d
```

## 4. Nginx (пример)

См. `deploy/nginx.example.conf`: два `server` для `app` и `widget`, прокси на `127.0.0.1:3030` и `127.0.0.1:3031`. Сертификаты — Certbot (`certbot --nginx`) или TLS на облачном балансировщике.

## 5. Код для сайта клиента

В дашборде раздел «Сайтқа қосу» после правильной сборки покажет что-то вроде:

```html
<script id="__qoldauaiSdk__" src="https://widget.example.com/qoldauai-sdk.js" data-chatbot-id="ВАSH_ID"></script>
```

При необходимости явно:

```html
<script
  id="__qoldauaiSdk__"
  src="https://widget.example.com/qoldauai-sdk.js"
  data-chatbot-id="..."
  data-base-url="https://app.example.com/api"
  data-widget-url="https://widget.example.com"
></script>
```

## 6. Безопасность

- Не коммитьте реальные `OPENAI_KEY` и секреты; держите их только на сервере.
- Смените `SECRET_KEY` и `ENC_KEY` в продакшене.
- Откройте наружу только **80/443** на reverse proxy; порты MongoDB/Redis не публикуйте.
