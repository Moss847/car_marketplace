-- Создание администратора
INSERT INTO "User" (
  id,
  email,
  password,
  firstName,
  lastName,
  role,
  createdAt,
  updatedAt
) VALUES (
  'admin-id',
  'admin@example.com',
  '$2b$10$YourHashedPasswordHere', -- Замените на реальный хеш пароля
  'Admin',
  'User',
  'ADMIN',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
); 