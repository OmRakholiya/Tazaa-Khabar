# NewsPulse Setup Guide

## Overview
NewsPulse is an intelligent news aggregation platform with email and WhatsApp notification capabilities. This guide will help you set up and configure the application.

## Features
- ✅ News article scraping and storage
- ✅ AI-powered chatbot for news queries
- ✅ Article filtering by category and sentiment
- ✅ Email notifications for selected articles
- ✅ WhatsApp notifications for selected articles
- ✅ Modern responsive UI

## Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB (optional, for persistent storage)

## Backend Setup

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Configuration
Create a `.env` file in the backend directory with the following variables:

```env
# Required: Gemini AI API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Email Configuration (Gmail recommended)
SENDER_EMAIL=your_email@gmail.com
SENDER_PASSWORD=your_app_password_here
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587

# WhatsApp Business API Configuration
WHATSAPP_TOKEN=your_whatsapp_business_api_token
WHATSAPP_PHONE_ID=your_whatsapp_phone_number_id

# Optional: MongoDB Configuration
MONGODB_URI=mongodb+srv://23aiml062_db_user:Wv7GpOzvMuY3y1M2@articles.7hfshvh.mongodb.net/ArticlesDB?retryWrites=true&w=majority&appName=Articles/newspulse
```

### 3. Email Setup (Gmail)
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Use this password in `SENDER_PASSWORD`

### 4. WhatsApp Business API Setup
1. Create a Facebook Developer account
2. Set up WhatsApp Business API
3. Get your access token and phone number ID
4. Add these to your `.env` file

### 5. Start Backend Server
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Frontend Setup

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Usage

### 1. Articles Page
- **Filters**: Located on the left side for easy access
- **Actions**: Refresh and Scrape buttons on the right side
- **Categories**: Politics, Technology, Business, Sports, etc.
- **Sentiment Analysis**: Positive, Negative, Neutral

### 2. Notifications Page
- Select articles you want to send
- Choose notification method (Email or WhatsApp)
- Enter recipient details
- Send notifications with formatted content

### 3. AI Chatbot
- Ask questions about current news
- Get intelligent responses powered by Gemini AI
- Formatted responses with proper structure

## API Endpoints

### Articles
- `GET /articles` - Fetch all articles
- `POST /scrape` - Scrape new articles

### Notifications
- `POST /send-email` - Send articles via email
- `POST /send-whatsapp` - Send articles via WhatsApp

### AI Chat
- `POST /chat` - Chat with AI about news

## Troubleshooting

### Email Issues
- Ensure App Password is correctly generated
- Check SMTP settings for your email provider
- Verify 2-factor authentication is enabled

### WhatsApp Issues
- Verify WhatsApp Business API credentials
- Check phone number format (include country code)
- Ensure API quotas are not exceeded

### General Issues
- Check all environment variables are set
- Verify backend server is running on port 8000
- Ensure frontend can connect to backend

## Security Notes
- Never commit `.env` files to version control
- Use App Passwords instead of regular passwords
- Keep API tokens secure and rotate them regularly
- Consider using environment-specific configurations

## Development
- Backend: FastAPI with Python
- Frontend: React with Vite
- Styling: Custom CSS with modern design
- Icons: React Icons (Heroicons)

## Support
For issues or questions, check the console logs and ensure all environment variables are properly configured.
