# Car Marketplace

Веб-приложение для размещения и поиска объявлений о продаже автомобилей.

## Функциональность

### Пользователи
- Регистрация и авторизация
- Профиль пользователя с возможностью редактирования
- Поддержка российских номеров телефона в форматах +7 и 8
- Избранные объявления
- Система сообщений между пользователями
- Просмотр истории сообщений даже для удаленных объявлений

### Объявления
- Создание объявлений с подробной информацией об автомобиле
- Загрузка до 5 фотографий
- Автоматическое форматирование цены и пробега
- Поиск по марке, модели, году, цене и другим параметрам
- Фильтрация результатов поиска
- Просмотр похожих объявлений
- Возможность удаления своих объявлений
- Мягкое удаление объявлений (soft delete) с сохранением истории сообщений

### Дополнительные функции
- Адаптивный дизайн для мобильных устройств
- Интерактивная галерея изображений
- Информация о продавце
- Система избранных объявлений
- Чат между покупателем и продавцом
- Блокировка отправки сообщений для удаленных объявлений
- Сохранение истории сообщений после удаления объявления

## Технологии

### Frontend
- React
- TypeScript
- Tailwind CSS
- React Query
- Redux Toolkit
- React Router
- Axios для HTTP-запросов

### Backend
- Node.js
- Express
- Prisma
- PostgreSQL
- JWT Authentication
- TypeScript

## Установка и запуск

### Требования
- Node.js 16+
- PostgreSQL 12+

### Установка зависимостей
```bash
# Установка зависимостей сервера
cd server
npm install

# Установка зависимостей клиента
cd ../client
npm install
```

### Настройка базы данных
1. Создайте базу данных PostgreSQL
2. Скопируйте `.env.example` в `.env` в папке server
3. Обновите переменные окружения в `.env`
4. Выполните миграции:
```bash
cd server
npx prisma migrate dev
```

### Запуск приложения
```bash
# Запуск сервера
cd server
npm run dev

# Запуск клиента
cd ../client
npm run dev
```

Приложение будет доступно по адресу http://localhost:5173

## Структура проекта

```
car_marketplace/
├── client/                 # Frontend приложение
│   ├── src/
│   │   ├── components/    # React компоненты
│   │   ├── pages/        # Страницы приложения
│   │   ├── services/     # API сервисы
│   │   ├── store/        # Redux store
│   │   ├── types/        # TypeScript типы
│   │   └── utils/        # Вспомогательные функции
│   └── public/           # Статические файлы
│
└── server/                # Backend приложение
    ├── src/
    │   ├── routes/       # API маршруты
    │   ├── middleware/   # Middleware функции
    │   ├── services/     # Бизнес-логика
    │   └── utils/        # Вспомогательные функции
    └── prisma/           # Схема базы данных
```

## API Endpoints

### Аутентификация
- POST /api/auth/register - Регистрация
- POST /api/auth/login - Вход
- GET /api/auth/me - Получение информации о текущем пользователе

### Объявления
- GET /api/listings - Получение списка объявлений
- POST /api/listings - Создание объявления
- GET /api/listings/:id - Получение информации об объявлении
- DELETE /api/listings/:id - Мягкое удаление объявления
- DELETE /api/listings/:id/permanent - Полное удаление объявления

### Избранное
- GET /api/favorites - Получение списка избранных объявлений
- POST /api/favorites/:id - Добавление в избранное
- DELETE /api/favorites/:id - Удаление из избранного

### Сообщения
- GET /api/messages/conversations - Получение списка диалогов
- GET /api/messages/listing/:id - Получение сообщений для объявления
- POST /api/messages/listing/:id - Отправка сообщения
- Блокировка отправки сообщений для удаленных объявлений
- Сохранение истории сообщений после удаления объявления

## Лицензия

MIT 