# Taaza Khabar - News Aggregator

A modern news aggregator that fetches the latest Indian news articles from multiple RSS feeds and displays them in a beautiful React UI.

## Features

- 📰 **Real-time News**: Fetches latest news from multiple Indian news sources
- 🎨 **Modern UI**: Beautiful, responsive design with smooth animations
- 🔄 **Live Updates**: Refresh functionality to get the latest news
- 📱 **Mobile Responsive**: Works perfectly on all device sizes
- 🗄️ **MongoDB Integration**: Stores articles in MongoDB database
- ⚡ **Fast API**: Built with FastAPI for high performance

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **MongoDB** - NoSQL database for storing articles
- **BeautifulSoup** - HTML parsing for RSS feeds
- **Feedparser** - RSS feed parsing
- **PyMongo** - MongoDB driver for Python

### Frontend
- **React 19** - Modern React with latest features
- **Vite** - Fast build tool and dev server
- **Axios** - HTTP client for API calls
- **Lucide React** - Beautiful icons
- **Date-fns** - Date formatting utilities

## Prerequisites

- Python 3.8+
- Node.js 16+
- MongoDB (running locally or remotely)

## Installation & Setup

### 1. Backend Setup

```bash
# Install Python dependencies
pip install -r requirements.txt

# Make sure MongoDB is running
# For local MongoDB: mongod
# For remote MongoDB: Update connection string in scraping/fetcher.py
```

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

## Running the Application

### 1. Start the Backend

```bash
# From the root directory
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The FastAPI server will start at `https://pulseai-backend-3.onrender.com`

### 2. Start the Frontend

```bash
# From the frontend directory
cd frontend
npm run dev
```

The React app will start at `http://localhost:5173`

## API Endpoints

- `GET /news/{count}` - Get latest news articles (count specifies number of articles)
- `GET /About` - Get project information

## Project Structure

```
app/
├── main.py                 # FastAPI application entry point
├── requirements.txt        # Python dependencies
├── routes/
│   ├── news.py            # News API routes
│   └── about.py           # About API routes
├── scraping/
│   └── fetcher.py         # RSS feed fetching and MongoDB operations
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Main React component
│   │   ├── App.css        # Styles for the news site
│   │   └── index.css      # Global styles
│   ├── package.json       # Node.js dependencies
│   └── vite.config.js     # Vite configuration
└── README.md              # This file
```

## Features in Detail

### News Sources
The application fetches news from multiple Indian news sources:
- India Today
- News18
- DNA India
- Firstpost
- Business Standard
- Outlook India
- Free Press Journal
- Deccan Chronicle
- Moneycontrol

### UI Features
- **Responsive Grid Layout**: Articles are displayed in a responsive grid
- **Article Cards**: Each article is displayed in a beautiful card with hover effects
- **Source Badges**: Color-coded badges showing the news source
- **Date Formatting**: Clean date display for article publication dates
- **Loading States**: Smooth loading animations
- **Error Handling**: User-friendly error messages
- **Refresh Functionality**: Manual refresh button to get latest news
- **Article Count Control**: Dropdown to select number of articles to display

### Database Integration
- Articles are automatically stored in MongoDB
- JSON backup is also maintained
- Duplicate handling and data cleaning

## Development

### Adding New News Sources
To add new RSS feeds, update the `RSS_FEEDS` dictionary in `scraping/fetcher.py`:

```python
RSS_FEEDS = {
    "New Source": "https://news-source.com/rss/feed.xml",
    # ... existing sources
}
```

### Customizing the UI
The React components and styles can be customized in:
- `frontend/src/App.jsx` - Main component logic
- `frontend/src/App.css` - Component styles
- `frontend/src/index.css` - Global styles

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure the FastAPI server is running and CORS is properly configured
2. **MongoDB Connection**: Ensure MongoDB is running and accessible
3. **RSS Feed Issues**: Some RSS feeds might be temporarily unavailable
4. **Port Conflicts**: Make sure ports 8000 (backend) and 5173 (frontend) are available

### Debug Mode
- Backend: FastAPI automatically provides interactive docs at `https://pulseai-backend-3.onrender.com/docs`
- Frontend: Check browser console for any JavaScript errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Author

**Daksh Savani** - Developer of Taaza Khabar

---

**Note**: Make sure to have MongoDB running before starting the application. The application will automatically create the necessary database and collections.
