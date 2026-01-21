# CourtMaster MVP - Quick Setup Guide

## 🚀 Get Started in 3 Steps

### 1. Install & Setup
```bash
npm install
npm run setup:mvp
```

### 2. Start Development
```bash
npm run dev
```

### 3. Login & Test
- Open `http://localhost:3000`
- **Admin**: `demoadmin@example.com` / `demopassword`
- **Player**: `demo@example.com` / `password`

## 📋 What's Included

✅ **Multi-Sport Support** - Badminton, Tennis, Volleyball  
✅ **Tournament Management** - Create and manage tournaments  
✅ **Real-time Scoring** - Live score updates  
✅ **Mock Authentication** - No external setup required  
✅ **Responsive Design** - Works on desktop and mobile  

## 🛠️ Development Commands

```bash
npm run dev          # Start development server
npm test             # Run tests
npm run build        # Build for production
npm run lint         # Check code style
npm run clean        # Clean build files
```

## 🔧 Troubleshooting

**Port 3000 in use?**
```bash
lsof -ti:3000 | xargs kill -9
```

**Dependencies issues?**
```bash
npm run reinstall
```

**Need help?** Check the main README.md for detailed information.

---
*This MVP version is optimized for local testing and development without external dependencies.*
