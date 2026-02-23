from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from routes.news import router
from routes.about import router2
from routes.auth import router_auth
from scraping import fetcher
from typing import List, Dict, Any
import asyncio

import google.generativeai as genai
import os
from dotenv import load_dotenv
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests
import json
from datetime import datetime

load_dotenv()
# Also try loading from parent directory
load_dotenv("../.env")

# Debug environment loading
print("=== Environment Debug ===")
print(f"Current working directory: {os.getcwd()}")
print(f"GEMINI_API_KEY loaded: {bool(os.getenv('GEMINI_API_KEY'))}")
print(f"SENDER_EMAIL: {os.getenv('SENDER_EMAIL')}")
print(f"SENDER_PASSWORD exists: {bool(os.getenv('SENDER_PASSWORD'))}")
print("========================")

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

app = FastAPI(title="Taaza Khabar")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","http://localhost:5174","https://smitpulseai.netlify.app","https://taazakhabar0.netlify.app"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/articles")
def get_all_articles():
    if fetcher.mongodb_available and fetcher.collection is not None:
        articles = list(fetcher.collection.find({}, {"_id": 0}))  # exclude MongoDB _id
        return {"articles": articles}
    return {"articles": []}

@app.post("/scrape")
def scrape_and_store(n: int = 20):
    result = fetcher.get_news(n)
    return {
        "message": result.get("message", f"Scraped {result.get('total', 0)} articles"),
        "articles": result.get("articles", []),
        "total": result.get("total", 0)
    }

# Request body models
class ChatRequest(BaseModel):
    query: str

class EmailRequest(BaseModel):
    email: str
    articles: List[Dict[str, Any]]

class WhatsAppRequest(BaseModel):
    whatsapp: str
    articles: List[Dict[str, Any]]


class SummarizeRequest(BaseModel):
    title: str
    summary: str

class RelatedRequest(BaseModel):
    title: str
    category: str
    summary: str




@app.post("/summarize")
async def summarize_article(request: SummarizeRequest):
    try:
        prompt = f"""You are a professional news editor. Summarize this news article with more detail than a standard TL;DR.
        
        Provide:
        1. A comprehensive summary paragraph (3-5 sentences) explaining the key events, context, and significance.
        2. A list of 2-3 key takeaway bullet points (start each with '- ').
        
        Keep the tone informative and objective. Use plain text but keep the bullet point structure.
        
        Title: {request.title}
        Content: {request.summary}
        
        DETAILED SUMMARY:"""
        
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        # Clean up unwanted markdown but preserve lines and bullets
        text = response.text.strip()
        text = text.replace('**', '').replace('__', '').replace('###', '').replace('##', '').replace('#', '').replace('`', '')
        
        return {"tldr": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")


@app.post("/related")
async def get_related_articles(request: RelatedRequest):
    try:
        # Use AI to find related keywords
        prompt = f"""Given this news article, suggest 5 search keywords (single words) that would help find related news articles. Return ONLY the keywords separated by commas, nothing else.

Title: {request.title}
Category: {request.category}
Summary: {request.summary}

Keywords:"""
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        keywords = [k.strip().lower() for k in response.text.strip().split(',') if k.strip()]
        
        # Search MongoDB for articles matching those keywords
        if fetcher.mongodb_available and fetcher.collection is not None and keywords:
            regex_pattern = '|'.join(keywords[:5])
            related = list(fetcher.collection.find(
                {
                    "$and": [
                        {"title": {"$regex": regex_pattern, "$options": "i"}},
                        {"title": {"$ne": request.title}}
                    ]
                },
                {"_id": 0}
            ).limit(6))
            
            # If regex approach found too few, try individual keyword searches
            if len(related) < 3:
                for kw in keywords:
                    extra = list(fetcher.collection.find(
                        {
                            "$or": [
                                {"title": {"$regex": kw, "$options": "i"}},
                                {"summary": {"$regex": kw, "$options": "i"}}
                            ],
                            "title": {"$ne": request.title}
                        },
                        {"_id": 0}
                    ).limit(3))
                    for e in extra:
                        if not any(r['title'] == e['title'] for r in related):
                            related.append(e)
                    if len(related) >= 6:
                        break
            
            return {"related": related[:6], "keywords": keywords}
        
        return {"related": [], "keywords": keywords}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Related articles failed: {str(e)}")

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        # Fetch latest articles for context
        news_context = ""
        if fetcher.mongodb_available and fetcher.collection is not None:
            articles = list(fetcher.collection.find({}, {"_id": 0, "title": 1, "source": 1, "category": 1, "summary": 1}).sort("fetched_at", -1).limit(40))
            if articles:
                news_context = "\nRECENT NEWS CONTEXT:\n"
                for i, a in enumerate(articles, 1):
                    news_context += f"{i}. [{a.get('category', 'Other')}] {a.get('title')} ({a.get('source')})\n"

        # Enhanced prompt for detailed, well-formatted responses
        enhanced_prompt = f"""
        You are the Taaza Khabar News Assistant. Your goal is to provide helpful, detailed, and accurate information about news and current events.
        
        {news_context}
        
        Guidelines for your response:
        - Use professional and engaging language.
        - Provide detailed answers with context when possible.
        - Use Markdown headers (## and ###) for organization.
        - Use bullet points (-) or numbered lists (1.) for clarity.
        - You can use **bold** or *italic* text for emphasis.
        - If referring to specific news above, mention the source.
        - If the user asks for a summary or what's new, use the RECENT NEWS CONTEXT provided.
        - If the context doesn't cover the query, use your general knowledge but mention you're doing so.
        
        User Query: {request.query}
        """
        
        response = model.generate_content(enhanced_prompt)
        raw_text = response.text.strip()
        
        # Structure the response
        formatted_response = {
            "text": raw_text,
            "formatted": True,
            "sections": parse_response_sections(raw_text)
        }
        
        return formatted_response
    except Exception as e:
        print(f"Chat error: {e}")
        return {"error": str(e)}

def parse_response_sections(text):
    """Parse markdown-style text into structured sections for the frontend"""
    sections = []
    lines = text.split('\n')
    current_section = {"type": "paragraph", "content": []}
    
    import re # Moved import re here
    
    for line in lines:
        stripped_line = line.strip()
        
        if not stripped_line:
            if current_section["content"]:
                sections.append(current_section)
                current_section = {"type": "paragraph", "content": []}
            continue
            
        # Headers
        if stripped_line.startswith('### '):
            if current_section["content"]: sections.append(current_section)
            sections.append({"type": "header", "level": 3, "content": [stripped_line[4:]]})
            current_section = {"type": "paragraph", "content": []}
            continue
        if stripped_line.startswith('## '):
            if current_section["content"]: sections.append(current_section)
            sections.append({"type": "header", "level": 2, "content": [stripped_line[3:]]})
            current_section = {"type": "paragraph", "content": []}
            continue
            
        # Lists
        if stripped_line.startswith(('- ', '• ', '* ')):
            if current_section["type"] != "bullet_list":
                if current_section["content"]: sections.append(current_section)
                current_section = {"type": "bullet_list", "content": []}
            current_section["content"].append(stripped_line[2:])
            continue
            
        if re.match(r'^\d+\.\s', stripped_line):
            if current_section["type"] != "numbered_list":
                if current_section["content"]: sections.append(current_section)
                current_section = {"type": "numbered_list", "content": []}
            current_section["content"].append(re.sub(r'^\d+\.\s', '', stripped_line))
            continue
            
        # Default to paragraph
        if current_section["type"] != "paragraph":
            sections.append(current_section)
            current_section = {"type": "paragraph", "content": []}
        current_section["content"].append(line) # Keep original line for sub-formatting later
        
    if current_section["content"]:
        sections.append(current_section)
        
    return sections

def format_articles_for_email(articles):
    """Format articles for email content"""
    email_content = """
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: #667eea; color: white; padding: 20px; text-align: center; }
            .article { border: 1px solid #ddd; margin: 20px 0; padding: 15px; border-radius: 8px; }
            .source { background: #667eea; color: white; padding: 5px 10px; border-radius: 15px; font-size: 12px; }
            .title { color: #1e293b; font-size: 18px; font-weight: bold; margin: 10px 0; }
            .summary { color: #64748b; margin: 10px 0; }
            .link { color: #667eea; text-decoration: none; }
            .footer { text-align: center; color: #64748b; margin-top: 30px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>📰 Your News Update from Taaza Khabar</h1>
            <p>Here are your selected news articles</p>
        </div>
    """
    
    for article in articles:
        email_content += f"""
        <div class="article">
            <span class="source">{article.get('source', 'Unknown')}</span>
            <h2 class="title">{article.get('title', 'No Title')}</h2>
            <p class="summary">{article.get('summary', 'No summary available')}</p>
            <p><strong>Published:</strong> {article.get('published', 'Unknown date')}</p>
            <p><a href="{article.get('link', '#')}" class="link" target="_blank">Read Full Article →</a></p>
        </div>
        """
    
    email_content += """
        <div class="footer">
            <p>Powered by Taaza Khabar - Intelligent News Without Overload</p>
            <p>This email was sent because you requested news updates through our platform.</p>
        </div>
    </body>
    </html>
    """
    
    return email_content

def format_articles_for_whatsapp(articles):
    """Format articles for WhatsApp message"""
    message = "📰 *Your News Update from Taaza Khabar*\n\n"
    
    for i, article in enumerate(articles, 1):
        message += f"*{i}. {article.get('title', 'No Title')}*\n"
        message += f"📍 Source: {article.get('source', 'Unknown')}\n"
        message += f"📅 {article.get('published', 'Unknown date')}\n\n"
        message += f"{article.get('summary', 'No summary available')}\n\n"
        if article.get('link'):
            message += f"🔗 Read more: {article.get('link')}\n\n"
        message += "─────────────────\n\n"
    
    message += "Powered by Taaza Khabar 🤖\n"
    message += "Intelligent News Without Overload"
    
    return message

@app.post("/send-email")
async def send_email(request: EmailRequest):
    try:
        # Email configuration from environment variables
        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        sender_email = os.getenv("SENDER_EMAIL")
        sender_password = os.getenv("SENDER_PASSWORD")
        
        print(f"Debug - SENDER_EMAIL: {sender_email}")
        print(f"Debug - SENDER_PASSWORD exists: {bool(sender_password)}")
        print(f"Debug - SMTP_SERVER: {smtp_server}")
        print(f"Debug - SMTP_PORT: {smtp_port}")
        
        if not sender_email or not sender_password:
            raise HTTPException(
                status_code=500, 
                detail=f"Email configuration not found. SENDER_EMAIL: {bool(sender_email)}, SENDER_PASSWORD: {bool(sender_password)}"
            )
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"📰 News Update from Taaza Khabar - {len(request.articles)} Articles"
        msg['From'] = sender_email
        msg['To'] = request.email
        
        # Create HTML content
        html_content = format_articles_for_email(request.articles)
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)
        
        # Send email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.send_message(msg)
        
        return {
            "success": True,
            "message": f"Successfully sent {len(request.articles)} articles to {request.email}"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

@app.post("/send-whatsapp")
async def send_whatsapp(request: WhatsAppRequest):
    try:
        # WhatsApp API configuration from environment variables
        whatsapp_token = os.getenv("WHATSAPP_TOKEN")
        whatsapp_phone_id = os.getenv("WHATSAPP_PHONE_ID")
        
        # For testing purposes, if WhatsApp credentials are not configured,
        # we'll simulate the sending and save to a file instead
        if not whatsapp_token or not whatsapp_phone_id or whatsapp_token == "your_whatsapp_business_api_token":
            # Format message
            message_text = format_articles_for_whatsapp(request.articles)
            
            # Save to file for testing
            timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
            filename = f"whatsapp_message_{timestamp}.txt"
            
            try:
                with open(filename, 'w', encoding='utf-8') as f:
                    f.write(f"WhatsApp Message for: {request.whatsapp}\n")
                    f.write(f"Timestamp: {datetime.now()}\n")
                    f.write("="*50 + "\n\n")
                    f.write(message_text)
                
                return {
                    "success": True,
                    "message": f"WhatsApp simulation: Message saved to {filename}. {len(request.articles)} articles prepared for {request.whatsapp}",
                    "simulation": True
                }
            except Exception as e:
                print(f"Error saving WhatsApp simulation: {e}")
                return {
                    "success": True,
                    "message": f"WhatsApp simulation successful: {len(request.articles)} articles prepared for {request.whatsapp}",
                    "simulation": True
                }
        
        # Real WhatsApp API implementation
        # Format message
        message_text = format_articles_for_whatsapp(request.articles)
        
        # WhatsApp Business API endpoint
        url = f"https://graph.facebook.com/v17.0/{whatsapp_phone_id}/messages"
        
        headers = {
            "Authorization": f"Bearer {whatsapp_token}",
            "Content-Type": "application/json"
        }
        
        # Clean phone number (remove non-digits except +)
        phone_number = ''.join(c for c in request.whatsapp if c.isdigit() or c == '+')
        if not phone_number.startswith('+'):
            phone_number = '+' + phone_number
        
        payload = {
            "messaging_product": "whatsapp",
            "to": phone_number,
            "type": "text",
            "text": {
                "body": message_text
            }
        }
        
        response = requests.post(url, headers=headers, json=payload)
        
        if response.status_code == 200:
            return {
                "success": True,
                "message": f"Successfully sent {len(request.articles)} articles to {request.whatsapp}"
            }
        else:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"WhatsApp API error: {response.text}"
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send WhatsApp message: {str(e)}")


# Include other routers
app.include_router(router)
app.include_router(router2)
app.include_router(router_auth)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app",host="127.0.0.1", port=8000, reload=True)


# Scheduled scraping background task
async def scheduled_scraper():
    """Background task that scrapes news every 60 minutes."""
    await asyncio.sleep(10)  # Wait 10s after startup
    while True:
        try:
            print("\n⏰ [Scheduled Scrape] Starting automatic news scrape...")
            result = fetcher.get_news(20)
            print(f"⏰ [Scheduled Scrape] Done — fetched {result.get('total', 0)} articles")
        except Exception as e:
            print(f"⏰ [Scheduled Scrape] Error: {e}")
        await asyncio.sleep(3600)  # Wait 60 minutes


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(scheduled_scraper())
    print("⏰ Scheduled scraping enabled — every 60 minutes")
