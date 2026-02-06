# Scripts Directory

This directory contains utility scripts for the VisualEyes ERP system.

## Available Scripts

### 1. Setup Script
```bash
npm run setup
```
- Sets up the project for first-time use
- Creates the default SuperAdmin account
- Checks database connectivity
- Provides next steps for getting started

### 2. Create SuperAdmin Script
```bash
npm run create-superadmin
```
- Creates a new SuperAdmin account with predefined credentials
- Useful for creating additional SuperAdmin accounts
- Validates that no duplicate accounts are created

## SuperAdmin Credentials

**Default SuperAdmin Account:**
- **Username:** anish
- **Email:** anishsinghrawat5@gmail.com
- **Password:** anish@2026
- **Phone:** 6395607666
- **Employee ID:** SA001

## Usage Instructions

1. **First Time Setup:**
   ```bash
   npm run setup
   ```

2. **Start the Server:**
   ```bash
   npm run dev
   ```

3. **Login:**
   - Use the SuperAdmin credentials to login
   - Access the system at `http://localhost:8080`

## Security Notes

- Change the default SuperAdmin password after first login
- The password is automatically hashed using bcrypt
- SuperAdmin has all permissions by default
- Account lockout is enabled after 5 failed login attempts

## Troubleshooting

- Ensure MongoDB is running and accessible
- Check your `.env` file for correct database connection string
- Verify all required environment variables are set