# EduPlatform - Educational Dashboard System

A comprehensive React-based educational platform similar to Udemy, built with modern web technologies.

## Features

### User Roles
- **Admin**: Platform management and overview
- **Teacher**: Course creation and management
- **Student**: Course enrollment and learning

### Core Functionality

#### Course Management
- Browse courses with filtering and search
- Detailed course pages with lecture content
- Video lectures, PDF resources, and quizzes
- Course enrollment system
- Progress tracking for students

#### Social Features
- **Community Page**: Social media-style posting and sharing
- **Blog System**: Teachers can write and publish articles
- **Q&A Section**: Common questions and answers

#### User Features
- User authentication (login/signup)
- Profile management
- Role-based dashboards
- Progress tracking and analytics

#### Teacher Features
- Course management dashboard
- View course statistics
- Track student enrollments
- Revenue tracking

#### Student Features
- Enrolled courses view
- Course player with video, PDF, and quiz support
- Progress tracking
- Grade viewing

## Technology Stack

- **Frontend**: React 18+ with Vite
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Styling**: CSS3 with CSS Variables
- **State Management**: React Context API

## Color Theme

Primary Color: `#2a8f9b` (Teal/Turquoise)

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Demo Credentials

### Admin
- Email: admin@edu.com
- Password: admin123

### Teacher
- Email: teacher@edu.com
- Password: teacher123

### Student
- Email: student@edu.com
- Password: student123

## Project Structure

```
src/
├── components/
│   ├── Common/          # Shared components (Layout, Navbar)
│   ├── Admin/           # Admin-specific components
│   ├── Teacher/         # Teacher-specific components
│   └── Student/         # Student-specific components
├── pages/
│   ├── Common/          # Shared pages (Login, Courses, Community, etc.)
│   ├── Admin/           # Admin dashboard
│   ├── Teacher/         # Teacher dashboard and course management
│   └── Student/         # Student dashboard and course player
├── contexts/            # React Context (Auth)
├── data/                # Mock data
└── App.jsx             # Main app component with routing
```

## Key Features Breakdown

### 1. Authentication System
- Login and Signup pages
- Role-based access control
- Protected routes
- User profile management

### 2. Course System
- Course listing with filters
- Course detail pages
- Course player (video, PDF, quiz)
- Progress tracking
- Lecture completion

### 3. Community Features
- Post creation and sharing
- Image attachments
- Like and comment system
- Active members list

### 4. Blog System
- Article creation and publishing
- Tag-based categorization
- View counts and likes
- Related articles

### 5. Q&A System
- Categorized questions
- Search functionality
- Helpful voting system

### 6. Dashboard Analytics
- Student progress tracking
- Teacher revenue analytics
- Course statistics
- User engagement metrics

## Future Enhancements

- Real backend API integration
- Payment processing
- Real-time notifications
- Video conferencing
- Assignment submissions
- Discussion forums
- Mobile app

## License

MIT License
