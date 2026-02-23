from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from auth_utils import hash_password, verify_password, create_access_token, decode_token
from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError, ConnectionFailure
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()
load_dotenv("../.env")

router_auth = APIRouter(prefix="/auth", tags=["Authentication"])

# MongoDB connection
_db_available = False
users_collection = None
bookmarks_collection = None
history_collection = None

try:
    mongodb_uri = os.getenv("MONGODB_URI")
    if not mongodb_uri:
        raise ConnectionFailure("MONGODB_URI not set")
    client = MongoClient(mongodb_uri, serverSelectionTimeoutMS=5000)
    client.admin.command('ping')
    db = client["news"]
    users_collection = db["users"]
    bookmarks_collection = db["bookmarks"]
    history_collection = db["reading_history"]
    users_collection.create_index("email", unique=True)
    history_collection.create_index([("user_email", 1), ("article_title", 1)])
    _db_available = True
    print("✅ Auth: MongoDB connected")
except Exception as e:
    print(f"⚠️ Auth: MongoDB not available - {e}")


# Models
class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class BookmarkRequest(BaseModel):
    article_title: str
    article_source: str
    article_summary: str
    article_link: str
    article_published: str

class ReadRequest(BaseModel):
    article_title: str
    article_source: str
    article_category: str


# Auth dependency
def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload


def _check_db():
    if not _db_available:
        raise HTTPException(status_code=500, detail="Database not available")


# Auth Routes
@router_auth.post("/signup")
async def signup(request: SignupRequest):
    _check_db()
    
    if len(request.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    existing = users_collection.find_one({"email": request.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = {
        "name": request.name.strip(),
        "email": request.email.lower().strip(),
        "password": hash_password(request.password),
        "created_at": datetime.utcnow().isoformat(),
        "preferences": {"categories": [], "theme": "dark"}
    }
    users_collection.insert_one(user)
    
    token = create_access_token({"email": user["email"], "name": user["name"]})
    return {
        "success": True,
        "token": token,
        "user": {"name": user["name"], "email": user["email"]}
    }


@router_auth.post("/login")
async def login(request: LoginRequest):
    _check_db()
    
    user = users_collection.find_one({"email": request.email.lower().strip()})
    if not user or not verify_password(request.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token({"email": user["email"], "name": user["name"]})
    return {
        "success": True,
        "token": token,
        "user": {"name": user["name"], "email": user["email"]}
    }


@router_auth.get("/me")
async def get_me_route(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return {"user": {"name": payload["name"], "email": payload["email"]}}


# Bookmark Routes
@router_auth.post("/bookmarks")
async def add_bookmark(bookmark: BookmarkRequest, authorization: str = Header(None)):
    user = get_current_user(authorization)
    _check_db()
    
    existing = bookmarks_collection.find_one({
        "user_email": user["email"],
        "article_title": bookmark.article_title
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already bookmarked")
    
    bookmark_data = {
        "user_email": user["email"],
        "article_title": bookmark.article_title,
        "article_source": bookmark.article_source,
        "article_summary": bookmark.article_summary,
        "article_link": bookmark.article_link,
        "article_published": bookmark.article_published,
        "bookmarked_at": datetime.utcnow().isoformat()
    }
    bookmarks_collection.insert_one(bookmark_data)
    return {"success": True, "message": "Article bookmarked"}


@router_auth.delete("/bookmarks")
async def remove_bookmark(article_title: str, authorization: str = Header(None)):
    user = get_current_user(authorization)
    _check_db()
    
    result = bookmarks_collection.delete_one({
        "user_email": user["email"],
        "article_title": article_title
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    return {"success": True, "message": "Bookmark removed"}


@router_auth.get("/bookmarks")
async def get_bookmarks(authorization: str = Header(None)):
    user = get_current_user(authorization)
    if not _db_available:
        return {"bookmarks": []}
    
    bookmarks = list(bookmarks_collection.find(
        {"user_email": user["email"]},
        {"_id": 0, "user_email": 0}
    ))
    return {"bookmarks": bookmarks}


# Reading History Routes
@router_auth.post("/read")
async def record_read(request: ReadRequest, authorization: str = Header(None)):
    user = get_current_user(authorization)
    _check_db()
    
    # Upsert — update timestamp if already read
    history_collection.update_one(
        {"user_email": user["email"], "article_title": request.article_title},
        {"$set": {
            "user_email": user["email"],
            "article_title": request.article_title,
            "article_source": request.article_source,
            "article_category": request.article_category,
            "read_at": datetime.utcnow().isoformat()
        }},
        upsert=True
    )
    return {"success": True}


@router_auth.get("/history")
async def get_history(authorization: str = Header(None)):
    user = get_current_user(authorization)
    if not _db_available:
        return {"history": []}
    
    history = list(history_collection.find(
        {"user_email": user["email"]},
        {"_id": 0, "user_email": 0}
    ).sort("read_at", -1).limit(50))
    return {"history": history}


@router_auth.get("/profile")
async def get_profile(authorization: str = Header(None)):
    user = get_current_user(authorization)
    if not _db_available:
        return {"profile": {}}
    
    user_doc = users_collection.find_one({"email": user["email"]}, {"_id": 0, "password": 0})
    reads = list(history_collection.find({"user_email": user["email"]}, {"_id": 0}))
    bookmark_count = bookmarks_collection.count_documents({"user_email": user["email"]})
    
    # Calculate favorite category
    cat_counts = {}
    for r in reads:
        cat = r.get("article_category", "Other")
        cat_counts[cat] = cat_counts.get(cat, 0) + 1
    fav_category = max(cat_counts, key=cat_counts.get) if cat_counts else "None"
    
    return {
        "profile": {
            "name": user_doc.get("name", "") if user_doc else user["name"],
            "email": user["email"],
            "member_since": user_doc.get("created_at", "") if user_doc else "",
            "total_reads": len(reads),
            "total_bookmarks": bookmark_count,
            "favorite_category": fav_category,
            "category_breakdown": cat_counts
        }
    }


# Trending — public endpoint (no auth required)
@router_auth.get("/trending")
async def get_trending():
    if not _db_available or history_collection is None:
        return {"trending": []}
    
    # Aggregate most-read articles across all users
    pipeline = [
        {"$group": {
            "_id": "$article_title",
            "source": {"$first": "$article_source"},
            "category": {"$first": "$article_category"},
            "read_count": {"$sum": 1},
            "last_read": {"$max": "$read_at"}
        }},
        {"$sort": {"read_count": -1}},
        {"$limit": 10},
        {"$project": {
            "_id": 0,
            "title": "$_id",
            "source": 1,
            "category": 1,
            "read_count": 1,
            "last_read": 1
        }}
    ]
    trending = list(history_collection.aggregate(pipeline))
    return {"trending": trending}
