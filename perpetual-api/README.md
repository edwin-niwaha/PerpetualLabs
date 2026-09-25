# 🛠️Perpetual Labs

A full-stack web application powered by **Django** (REST API backend) and **Next.js** (React frontend).  
The platform is built for modern, scalable, and responsive digital solutions.

[![Python](https://img.shields.io/badge/python-3.12-blue)](https://www.python.org/downloads/release/python-3120/)

---

## 🚀 Tech Stack

### 🔧 Backend – Django
- Django REST Framework
- PostgreSQL
- Custom user authentication
- Media & static file handling
- Email support

### 💻 Frontend – Next.js
- React 18
- Tailwind CSS
- API integration with Django backend
- Responsive design
- Form handling

---

## 🧩 Project Structure

## ⚙️ Getting Started

### 📥 1. Clone the Repository

```bash
git clone https://github.com/edwin-niwaha/perpetual_ict.git
cd perpetual_ict
```

## 🖥️ 2. Backend Setup (Django)

```
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
source .venv/scripts/activate

# Install dependencies
pip install -r requirements.txt

# Add environment variables
cp .env.example .env           # or create your own .env

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start the server
python manage.py runserver
```