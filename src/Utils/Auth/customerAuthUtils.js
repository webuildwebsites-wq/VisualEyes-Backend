import crypto from 'crypto';

export const generateCustomerCode = (shopName) => {
  const shopPrefix = shopName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 4)
    .padEnd(4, 'X');
  
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${shopPrefix}-${randomSuffix}`;
};

export const generateRandomPassword = () => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '@#$%^&*!';
  
  const allChars = uppercase + lowercase + numbers + special;
  
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  for (let i = 4; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

export const generateEmployeeCode = (employeeName) => {
  const empPrefix = employeeName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 4)
    .padEnd(4, 'E');
  
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${empPrefix}-${randomSuffix}`;
};
