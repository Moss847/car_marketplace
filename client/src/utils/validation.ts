// ... existing code ...
export const normalizePhone = (phone: string): string => {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If number starts with 8, replace it with +7
  if (digits.startsWith('8')) {
    return '+7' + digits.slice(1);
  }
  
  // If number starts with 7, add + prefix
  if (digits.startsWith('7')) {
    return '+' + digits;
  }
  
  // If number doesn't start with 7 or 8, assume it's a local number and add +7
  return '+7' + digits;
};

export const validatePhone = (phone: string): boolean => {
  // Accept both +7XXXXXXXXXX and 8XXXXXXXXXX formats
  const phoneRegex = /^(\+7|8)[0-9]{10}$/;
  return phoneRegex.test(phone);
};

// ... existing code ...
export const getPhoneError = (phone: string): string | null => {
  if (!phone) {
    return 'Номер телефона обязателен';
  }
  if (!validatePhone(phone)) {
    return 'Введите корректный российский номер телефона (+7XXXXXXXXXX или 8XXXXXXXXXX)';
  }
  return null;
};

export const getEmailError = (email: string): string | null => {
  if (!email) return 'Email обязателен';
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Введите корректный email';
  }
  
  return null;
};

export const getPasswordError = (password: string): string | null => {
  if (!password) return 'Пароль обязателен';
  
  if (password.length < 6) {
    return 'Пароль должен быть не менее 6 символов';
  }
  
  if (!/[A-Z]/.test(password)) {
    return 'Пароль должен содержать хотя бы одну заглавную букву';
  }
  
  if (!/[a-z]/.test(password)) {
    return 'Пароль должен содержать хотя бы одну строчную букву';
  }
  
  if (!/[0-9]/.test(password)) {
    return 'Пароль должен содержать хотя бы одну цифру';
  }
  
  return null;
};
// ... existing code ...