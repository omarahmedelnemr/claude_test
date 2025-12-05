// Mock Users Data
export const users = [
  {
    id: 1,
    name: 'John Admin',
    email: 'admin@edu.com',
    password: 'admin123',
    role: 'admin',
    avatar: 'https://ui-avatars.com/api/?name=John+Admin&background=2a8f9b&color=fff',
    bio: 'System Administrator',
    joinDate: '2023-01-15'
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    email: 'teacher@edu.com',
    password: 'teacher123',
    role: 'teacher',
    avatar: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=2a8f9b&color=fff',
    bio: 'Full Stack Development Instructor with 10+ years of experience',
    joinDate: '2023-02-20',
    expertise: ['JavaScript', 'React', 'Node.js']
  },
  {
    id: 3,
    name: 'Michael Chen',
    email: 'teacher2@edu.com',
    password: 'teacher123',
    role: 'teacher',
    avatar: 'https://ui-avatars.com/api/?name=Michael+Chen&background=2a8f9b&color=fff',
    bio: 'Data Science and Machine Learning Expert',
    joinDate: '2023-03-10',
    expertise: ['Python', 'Machine Learning', 'Data Analysis']
  },
  {
    id: 4,
    name: 'Emily Davis',
    email: 'student@edu.com',
    password: 'student123',
    role: 'student',
    avatar: 'https://ui-avatars.com/api/?name=Emily+Davis&background=2a8f9b&color=fff',
    bio: 'Aspiring Full Stack Developer',
    joinDate: '2023-06-01',
    enrolledCourses: [1, 3]
  },
  {
    id: 5,
    name: 'David Martinez',
    email: 'student2@edu.com',
    password: 'student123',
    role: 'student',
    avatar: 'https://ui-avatars.com/api/?name=David+Martinez&background=2a8f9b&color=fff',
    bio: 'Computer Science Student',
    joinDate: '2023-07-15',
    enrolledCourses: [2]
  }
];

// Mock Courses Data
export const courses = [
  {
    id: 1,
    title: 'Complete React Development Bootcamp',
    description: 'Learn React from scratch and build modern web applications',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=225&fit=crop',
    teacherId: 2,
    category: 'Web Development',
    level: 'Beginner',
    duration: '40 hours',
    rating: 4.8,
    studentsEnrolled: 1250,
    price: 89.99,
    createdAt: '2023-04-01',
    lectures: [
      {
        id: 1,
        title: 'Introduction to React',
        duration: '45 min',
        content: [
          { type: 'video', url: 'https://www.example.com/video1.mp4', duration: '15 min' },
          { type: 'pdf', url: '/docs/react-intro.pdf', title: 'React Introduction Guide' },
          { type: 'quiz', id: 1, title: 'React Basics Quiz', questions: 5 }
        ]
      },
      {
        id: 2,
        title: 'Components and Props',
        duration: '60 min',
        content: [
          { type: 'video', url: 'https://www.example.com/video2.mp4', duration: '30 min' },
          { type: 'pdf', url: '/docs/components.pdf', title: 'Components Deep Dive' }
        ]
      },
      {
        id: 3,
        title: 'State and Lifecycle',
        duration: '50 min',
        content: [
          { type: 'video', url: 'https://www.example.com/video3.mp4', duration: '40 min' },
          { type: 'quiz', id: 2, title: 'State Management Quiz', questions: 8 }
        ]
      }
    ]
  },
  {
    id: 2,
    title: 'Python for Data Science',
    description: 'Master Python programming and data analysis techniques',
    thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400&h=225&fit=crop',
    teacherId: 3,
    category: 'Data Science',
    level: 'Intermediate',
    duration: '35 hours',
    rating: 4.9,
    studentsEnrolled: 980,
    price: 79.99,
    createdAt: '2023-05-15',
    lectures: [
      {
        id: 4,
        title: 'Python Fundamentals',
        duration: '40 min',
        content: [
          { type: 'video', url: 'https://www.example.com/python1.mp4', duration: '30 min' },
          { type: 'pdf', url: '/docs/python-basics.pdf', title: 'Python Basics' }
        ]
      },
      {
        id: 5,
        title: 'Data Analysis with Pandas',
        duration: '70 min',
        content: [
          { type: 'video', url: 'https://www.example.com/pandas.mp4', duration: '60 min' },
          { type: 'quiz', id: 3, title: 'Pandas Quiz', questions: 10 }
        ]
      }
    ]
  },
  {
    id: 3,
    title: 'Advanced JavaScript Patterns',
    description: 'Deep dive into advanced JavaScript concepts and design patterns',
    thumbnail: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=400&h=225&fit=crop',
    teacherId: 2,
    category: 'Web Development',
    level: 'Advanced',
    duration: '30 hours',
    rating: 4.7,
    studentsEnrolled: 650,
    price: 99.99,
    createdAt: '2023-06-20',
    lectures: [
      {
        id: 6,
        title: 'Closures and Scope',
        duration: '55 min',
        content: [
          { type: 'video', url: 'https://www.example.com/closures.mp4', duration: '45 min' },
          { type: 'pdf', url: '/docs/closures.pdf', title: 'Understanding Closures' }
        ]
      }
    ]
  }
];

// Mock Quizzes Data
export const quizzes = [
  {
    id: 1,
    title: 'React Basics Quiz',
    courseId: 1,
    questions: [
      {
        id: 1,
        question: 'What is React?',
        type: 'multiple-choice',
        options: ['A JavaScript library', 'A programming language', 'A database', 'An operating system'],
        correctAnswer: 0
      },
      {
        id: 2,
        question: 'What is JSX?',
        type: 'multiple-choice',
        options: ['A JavaScript extension', 'A CSS framework', 'A database query language', 'A server technology'],
        correctAnswer: 0
      },
      {
        id: 3,
        question: 'React uses a _____ DOM',
        type: 'text',
        correctAnswer: 'virtual'
      }
    ]
  },
  {
    id: 2,
    title: 'State Management Quiz',
    courseId: 1,
    questions: [
      {
        id: 4,
        question: 'Which hook is used to manage state in functional components?',
        type: 'multiple-choice',
        options: ['useState', 'useEffect', 'useContext', 'useReducer'],
        correctAnswer: 0
      }
    ]
  }
];

// Mock Student Progress Data
export const studentProgress = [
  {
    studentId: 4,
    courseId: 1,
    progress: 65,
    completedLectures: [1, 2],
    quizScores: [
      { quizId: 1, score: 85, completedAt: '2023-11-15' }
    ],
    lastAccessedAt: '2023-12-01'
  },
  {
    studentId: 4,
    courseId: 3,
    progress: 30,
    completedLectures: [6],
    quizScores: [],
    lastAccessedAt: '2023-11-28'
  },
  {
    studentId: 5,
    courseId: 2,
    progress: 45,
    completedLectures: [4],
    quizScores: [
      { quizId: 3, score: 90, completedAt: '2023-11-20' }
    ],
    lastAccessedAt: '2023-11-30'
  }
];

// Mock Community Posts
export const communityPosts = [
  {
    id: 1,
    authorId: 2,
    content: 'Just published a new course on React! Check it out and let me know what you think.',
    image: null,
    createdAt: '2023-12-01T10:00:00',
    likes: 45,
    comments: [
      { id: 1, authorId: 4, content: 'Looks amazing! Already enrolled!', createdAt: '2023-12-01T11:00:00' },
      { id: 2, authorId: 5, content: 'Great content as always!', createdAt: '2023-12-01T12:00:00' }
    ]
  },
  {
    id: 2,
    authorId: 4,
    content: 'Finally completed my first React project! Thanks to all the amazing teachers here.',
    image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&h=400&fit=crop',
    createdAt: '2023-12-02T14:30:00',
    likes: 28,
    comments: []
  },
  {
    id: 3,
    authorId: 3,
    content: 'Tips for learning Data Science: Practice daily, work on real projects, and never stop being curious!',
    image: null,
    createdAt: '2023-12-03T09:00:00',
    likes: 67,
    comments: [
      { id: 3, authorId: 5, content: 'Thank you for the motivation!', createdAt: '2023-12-03T10:00:00' }
    ]
  }
];

// Mock Blog Articles
export const blogArticles = [
  {
    id: 1,
    title: 'The Future of Web Development in 2024',
    authorId: 2,
    excerpt: 'Exploring upcoming trends and technologies that will shape web development...',
    content: 'Web development is constantly evolving. In 2024, we can expect to see major shifts in how we build and deploy applications...',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=400&fit=crop',
    createdAt: '2023-11-20T08:00:00',
    tags: ['Web Development', 'Technology', 'Trends'],
    views: 1234,
    likes: 89
  },
  {
    id: 2,
    title: 'Getting Started with Machine Learning',
    authorId: 3,
    excerpt: 'A beginner-friendly guide to understanding machine learning concepts...',
    content: 'Machine Learning can seem intimidating at first, but with the right approach, anyone can learn it...',
    image: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&h=400&fit=crop',
    createdAt: '2023-11-25T10:00:00',
    tags: ['Machine Learning', 'AI', 'Tutorial'],
    views: 987,
    likes: 76
  }
];

// Mock QA Data
export const qaData = [
  {
    id: 1,
    question: 'How do I enroll in a course?',
    answer: 'To enroll in a course, browse the course catalog, select a course, and click the "Enroll Now" button. Once enrolled, you\'ll have immediate access to all course materials.',
    category: 'Enrollment',
    helpful: 125
  },
  {
    id: 2,
    question: 'Can I get a refund?',
    answer: 'Yes, we offer a 30-day money-back guarantee. If you\'re not satisfied with a course, you can request a full refund within 30 days of purchase.',
    category: 'Payments',
    helpful: 89
  },
  {
    id: 3,
    question: 'How long do I have access to a course?',
    answer: 'Once you enroll in a course, you have lifetime access. You can learn at your own pace and revisit the materials anytime.',
    category: 'Access',
    helpful: 156
  },
  {
    id: 4,
    question: 'Do I get a certificate upon completion?',
    answer: 'Yes, you will receive a certificate of completion when you finish all lectures and quizzes in a course with a passing grade.',
    category: 'Certificates',
    helpful: 201
  },
  {
    id: 5,
    question: 'Can teachers interact with students?',
    answer: 'Absolutely! Teachers can post in the community, respond to questions, and engage with students through various platform features.',
    category: 'Interaction',
    helpful: 78
  }
];
