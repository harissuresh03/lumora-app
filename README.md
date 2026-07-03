# 🌿 Lumora: Smart Mental Health Monitoring System for Students

Lumora is a comprehensive web-based mental health platform designed to support university students through AI-driven emotional monitoring, academic stress prediction, peer support, and counsellor oversight.

This project was developed as part of a Final Year Project (FYP) at **Universiti Teknikal Malaysia Melaka (UTeM)**.

---

## 📖 Overview

Lumora addresses the growing mental health challenges faced by university students by providing:

- **AI-powered emotional support** via conversational companion
- **Real-time mood and sleep tracking** with visual analytics
- **Digital journaling** with AI sentiment analysis
- **Academic stress prediction** based on deadlines and mood data
- **Moderated peer support community** for safe connection
- **Clinical assessments** (PHQ-9, GAD-7) with instant results
- **Counsellor dashboard** with risk alerts and wellness reports
- **Admin panel** for full system management

The platform provides continuous mental health monitoring through mood tracking, self-assessment journals, behavioral insights, and data-driven recommendations. By leveraging modern web technologies and AI, Lumora aims to encourage self-awareness and proactive mental health care among students.

---

## ✨ Features

### 👤 User Management
- User registration and authentication
- Secure JWT-based login system
- Role-based access control (Student, Counsellor, Admin)
- User profile management with consent settings

### 📊 Mental Health Monitoring
- Daily mood tracking (1-5 scale)
- Sleep tracking with automated quality scoring
- Digital journaling with AI sentiment analysis
- Academic stress prediction (7-day forecast)
- Behavioral pattern tracking and visualization
- Monthly mood calendar

### 🤖 Smart Insights & AI
- AI-powered conversational companion (Groq API)
- Automatic mood detection from journals and chat
- Personalized wellness recommendations
- Real-time monitoring and analytics
- Early warning detection system

### 🧑‍🏫 Counsellor Tools
- Centralized student monitoring dashboard
- Secure messaging with students
- Appointment management (schedule, accept, decline, complete)
- Crisis alerts with severity indicators
- Wellness report generation (PDF)
- Student data export (CSV)

### 🔧 Admin Panel
- User management (view, ban, unban, delete)
- Counsellor request approval/rejection
- Support resource management
- Issue report management
- System settings configuration

### 🔔 Notifications
- Real-time in-app notifications
- Email alerts for crisis detection
- Counsellor approval/rejection emails
- Appointment reminders

### 🌐 Accessibility
- Cross-device compatibility (desktop, tablet, mobile)
- Browser-based access without installation
- Light, dark, and high-contrast themes
- Adjustable font sizes and keyboard navigation

---

## 🛠️ Technology Stack

| **Category** | **Technology** |
|--------------|----------------|
| **Frontend** | React.js, CSS, Axios |
| **Backend** | Node.js, Express.js |
| **Database** | MySQL, Firebase Firestore |
| **AI / NLP** | Groq API (LLaMA 3.3 70B) |
| **Authentication** | JWT, bcrypt |
| **Email** | Nodemailer (SMTP) |
| **PDF Generation** | PDFKit |
| **Version Control** | Git, GitHub |

---

## 🚀 Installation

### Prerequisites

- Node.js (v16 or higher)
- MySQL (v8 or higher)
- Git

### Backend Setup

```bash
cd backend
npm install
```

### Frontend Setup

```bash
cd frontend
npm install
```

### 🔐 Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server
PORT=5000

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=mental_health_app

# JWT
JWT_SECRET=your_jwt_secret_key

# Groq API
GROQ_API_KEY=your_groq_api_key

# Email (SMTP)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
FRONTEND_URL=http://localhost:3000

# Firebase
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_service_account_email
```

⚠️ **Important:** Never commit `.env` to version control. Add it to `.gitignore`.

---

## 🏃 Running the Application

### Start the Backend

```bash
cd backend
npm start
```

Server runs at: `http://localhost:5000`

### Start the Frontend

```bash
cd frontend
npm start
```

Application runs at: `http://localhost:3000`

### Run Both (Development)

```bash
# Terminal 1
cd backend && npm start

# Terminal 2
cd frontend && npm start
```

---

## 📊 Expected Outcomes

Lumora aims to:

- Improve mental health awareness among students
- Enable early detection of stress and emotional issues
- Promote proactive intervention and self-care
- Reduce barriers to mental health support
- Support student well-being and academic success
- Provide counsellors with data-driven insights

---

## 🔒 Privacy & Security

Mental health data is highly sensitive. Lumora prioritizes:

- Secure authentication using JWT tokens
- bcrypt password encryption
- HTTPS for all data transmission
- Role-based access control
- Student data only shared with counsellors upon explicit consent
- Data deleted upon account deletion
- Admin audit logs for accountability

---

## 🙏 Acknowledgements

- **Supervisor:** Dr. Asniyani Nur Haidar Binti Abdullah
- **Faculty:** Faculty of Information and Communication Technology, UTeM
- **Technologies:** React, Node.js, MySQL, Firebase, Groq API
- **Open-source libraries:** PDFKit, Nodemailer, bcrypt, JWT

---

## 👤 Author

**Haris A/L R Suresh**
Bachelor of Computer Science (Software Development) with Honours
Universiti Teknikal Malaysia Melaka (UTeM)

---

## 📄 License

This project is for academic purposes as part of a Final Year Project at Universiti Teknikal Malaysia Melaka (UTeM).

---

## ⚠️ Disclaimer

Lumora is a mental health support tool and does not replace professional mental health care. If you are in crisis, please contact emergency services or a mental health professional immediately.