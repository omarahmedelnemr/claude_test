import { Link } from 'react-router-dom';
import {
  Video, BookOpen, FileText, MessageSquare,
  Users, Calendar, Award, Shield,
  ArrowRight, CheckCircle2, TrendingUp, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import SEO from '../../components/SEO/SEO';
import './LandingPage.css';

const LandingPage = () => {
  const { currentUser } = useAuth();

  const baseUrl = import.meta.env.VITE_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');

  // Structured data for organization
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'Ta3afi Education',
    description: 'A comprehensive online learning platform connecting students, teachers, and parents. Browse courses, learn from expert teachers, and track your progress.',
    url: baseUrl,
    logo: `${baseUrl}/Logo Vertical.png`,
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
    },
  };

  return (
    <div className="lp">
      <SEO
        title="Ta3afi Education - Online Learning Platform"
        description="Ta3afi Education is a comprehensive online learning platform connecting students, teachers, and parents. Live classes, recorded lectures, assignments, and real-time feedback — all in one platform built for modern education."
        keywords="online education, e-learning, courses, teachers, students, online learning platform, education technology, live classes, recorded lectures, assignments, parent portal"
        url="/"
        type="website"
        structuredData={structuredData}
      />

      {/* ── Nav ── */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <Link to="/" className="lp-logo">
            <img src="/Logo Vertical.png" alt="Ta3afi Education" />
          </Link>
          <div className="lp-nav-links">
            <Link to="/courses">Courses</Link>
            <Link to="/teachers">Teachers</Link>
            <Link to="/blog">Blog</Link>
          </div>
          <div className="lp-nav-actions">
            {currentUser ? (
              <Link to="/dashboard" className="lp-btn-primary">Go to Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="lp-nav-login">Log in</Link>
                <Link to="/signup" className="lp-btn-primary">Sign up free</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="lp-hero">
        <div className="lp-hero-inner">

          <div className="lp-hero-text">
            <div className="lp-tag">For students, teachers &amp; parents</div>
            <h1>
              The smarter way<br />
              to learn.<br />
              <em>Together.</em>
            </h1>
            <p>
              Live classes, recorded lectures, assignments, and real-time
              feedback — all in one platform built for modern education.
            </p>
            <div className="lp-hero-ctas">
              <Link to="/signup" className="lp-btn-primary lp-btn-lg">
                Start for free <ArrowRight size={18} />
              </Link>
              <Link to="/courses" className="lp-btn-ghost lp-btn-lg">
                Browse courses
              </Link>
            </div>
            <div className="lp-hero-proof">
              <div className="lp-avatars">
                <span className="lp-avatar" style={{ background: '#f6a623' }}>A</span>
                <span className="lp-avatar" style={{ background: '#7c5cbf' }}>B</span>
                <span className="lp-avatar" style={{ background: '#e07b5a' }}>C</span>
                <span className="lp-avatar" style={{ background: '#3aaa7a' }}>D</span>
              </div>
              <span>Joined by <strong>10,000+</strong> students this year</span>
            </div>
          </div>

          {/* Mock dashboard */}
          <div className="lp-hero-visual">
            <div className="lp-dash">
              <div className="lp-dash-header">
                <div className="lp-dash-dot red"></div>
                <div className="lp-dash-dot yellow"></div>
                <div className="lp-dash-dot green"></div>
                <span>My Dashboard</span>
              </div>
              <div className="lp-dash-body">
                <div className="lp-dash-stat-row">
                  <div className="lp-dash-stat">
                    <span className="lp-ds-num">94%</span>
                    <span className="lp-ds-label">Attendance</span>
                  </div>
                  <div className="lp-dash-stat">
                    <span className="lp-ds-num">12</span>
                    <span className="lp-ds-label">Courses</span>
                  </div>
                  <div className="lp-dash-stat">
                    <span className="lp-ds-num">3.8</span>
                    <span className="lp-ds-label">Avg. Grade</span>
                  </div>
                </div>

                <div className="lp-dash-section-label">Current courses</div>

                <div className="lp-dash-course">
                  <div className="lp-dcc">
                    <BookOpen size={13} />
                    <span>Mathematics — Algebra</span>
                  </div>
                  <div className="lp-dcp">
                    <div className="lp-dcp-bar">
                      <div className="lp-dcp-fill" style={{ width: '72%' }}></div>
                    </div>
                    <span>72%</span>
                  </div>
                </div>

                <div className="lp-dash-course">
                  <div className="lp-dcc">
                    <Video size={13} />
                    <span>Physics — Mechanics</span>
                  </div>
                  <div className="lp-dcp">
                    <div className="lp-dcp-bar">
                      <div className="lp-dcp-fill" style={{ width: '55%' }}></div>
                    </div>
                    <span>55%</span>
                  </div>
                </div>

                <div className="lp-dash-course">
                  <div className="lp-dcc">
                    <FileText size={13} />
                    <span>Arabic Literature</span>
                  </div>
                  <div className="lp-dcp">
                    <div className="lp-dcp-bar">
                      <div className="lp-dcp-fill" style={{ width: '88%' }}></div>
                    </div>
                    <span>88%</span>
                  </div>
                </div>

                <div className="lp-dash-upcoming">
                  <div className="lp-du-label">
                    <Calendar size={11} />
                    <span>Next live session</span>
                  </div>
                  <div className="lp-du-session">
                    <div className="lp-du-dot"></div>
                    <span>Chemistry — Today at 5:00 PM</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lp-float-card lp-float-1">
              <Award size={15} />
              <div>
                <div className="lp-fc-title">Certificate earned</div>
                <div className="lp-fc-sub">Mathematics Level 1</div>
              </div>
            </div>

            <div className="lp-float-card lp-float-2">
              <TrendingUp size={15} />
              <div>
                <div className="lp-fc-title">+12% this week</div>
                <div className="lp-fc-sub">Progress update</div>
              </div>
            </div>
          </div>
        </div>

        <div className="lp-hero-stats-bar">
          <div className="lp-stat">
            <strong>10K+</strong>
            <span>Active Students</span>
          </div>
          <div className="lp-stat-sep"></div>
          <div className="lp-stat">
            <strong>500+</strong>
            <span>Expert Teachers</span>
          </div>
          <div className="lp-stat-sep"></div>
          <div className="lp-stat">
            <strong>2,000+</strong>
            <span>Courses Available</span>
          </div>
          <div className="lp-stat-sep"></div>
          <div className="lp-stat">
            <strong>4 roles</strong>
            <span>Student · Teacher · Parent · Admin</span>
          </div>
        </div>
      </section>

      {/* ── Features / Bento grid ── */}
      <section className="lp-features">
        <div className="lp-container">
          <div className="lp-section-kicker">Platform features</div>
          <h2 className="lp-section-title">Everything your school needs</h2>

          <div className="lp-bento">
            <div className="lp-bento-card lp-bc-a">
              <div className="lp-bento-icon"><Video size={26} /></div>
              <h3>Live &amp; Recorded Lectures</h3>
              <p>Attend live sessions or catch up with recordings. Attendance is tracked automatically — no manual registers.</p>
              <div className="lp-bento-tag">Real-time</div>
            </div>

            <div className="lp-bento-card lp-bc-b">
              <div className="lp-bento-icon"><MessageSquare size={26} /></div>
              <h3>Community Forum</h3>
              <p>Students and teachers share resources, ask questions, and discuss topics in a moderated space built for education.</p>
            </div>

            <div className="lp-bento-card lp-bc-c">
              <div className="lp-bento-icon"><BookOpen size={26} /></div>
              <h3>Interactive Courses</h3>
              <p>Video lessons, PDFs, quizzes, and structured learning paths built by qualified teachers.</p>
            </div>

            <div className="lp-bento-card lp-bc-d">
              <div className="lp-bento-icon"><FileText size={26} /></div>
              <h3>Assignments &amp; Feedback</h3>
              <p>Submit work, get detailed feedback, and see grades all in one place.</p>
            </div>

            <div className="lp-bento-card lp-bc-e">
              <div className="lp-bento-icon"><Users size={26} /></div>
              <h3>Expert Teachers</h3>
              <p>Learn from experienced educators who create engaging content and provide personalised guidance.</p>
            </div>

            <div className="lp-bento-card lp-bc-f">
              <div className="lp-bento-icon"><Calendar size={26} /></div>
              <h3>1-on-1 Sessions</h3>
              <p>Book private tutoring appointments directly with any teacher on the platform.</p>
            </div>

            <div className="lp-bento-card lp-bc-g">
              <div className="lp-bento-icon"><Award size={26} /></div>
              <h3>Progress &amp; Certificates</h3>
              <p>Detailed analytics, grade tracking, and shareable certificates students can be proud of.</p>
              <div className="lp-bento-tag">New</div>
            </div>

            <div className="lp-bento-card lp-bc-h">
              <div className="lp-bento-icon"><Shield size={26} /></div>
              <h3>Parent Portal</h3>
              <p>
                Parents get a dedicated view of their child's attendance, grades, and upcoming sessions —
                so the whole family stays in the loop.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="lp-how">
        <div className="lp-container">
          <div className="lp-how-inner">
            <div className="lp-how-header">
              <div className="lp-section-kicker">Getting started</div>
              <h2 className="lp-section-title">Up and running in minutes</h2>
              <p>No training sessions, no onboarding calls. Just sign up and start.</p>
            </div>

            <div className="lp-steps">
              <div className="lp-step">
                <div className="lp-step-num">01</div>
                <div className="lp-step-body">
                  <h3>Create your account</h3>
                  <p>Sign up as a student, teacher, or parent. Free — no credit card required.</p>
                </div>
              </div>
              <div className="lp-step">
                <div className="lp-step-num">02</div>
                <div className="lp-step-body">
                  <h3>Find your courses</h3>
                  <p>Browse the full catalog, read reviews from real students, and enrol instantly.</p>
                </div>
              </div>
              <div className="lp-step">
                <div className="lp-step-num">03</div>
                <div className="lp-step-body">
                  <h3>Start learning</h3>
                  <p>Attend live classes, watch recordings, submit assignments, and track your progress.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Us ── */}
      <section className="lp-why">
        <div className="lp-container">
          <div className="lp-why-inner">
            <div className="lp-why-text">
              <div className="lp-section-kicker">Why Ta3afi</div>
              <h2 className="lp-section-title">Built for real classrooms</h2>
              <p className="lp-why-desc">
                Most ed-tech platforms are built for Silicon Valley. We built
                Ta3afi for students and teachers who need something that
                actually works in the classroom.
              </p>
              <div className="lp-checks">
                <div className="lp-check">
                  <CheckCircle2 size={17} />
                  <span><strong>Flexible scheduling</strong> — live and recorded sessions</span>
                </div>
                <div className="lp-check">
                  <CheckCircle2 size={17} />
                  <span><strong>Multiple roles</strong> — one platform for everyone</span>
                </div>
                <div className="lp-check">
                  <CheckCircle2 size={17} />
                  <span><strong>Parent visibility</strong> — keep families in the loop</span>
                </div>
                <div className="lp-check">
                  <CheckCircle2 size={17} />
                  <span><strong>Real-time communication</strong> — chat and live sessions</span>
                </div>
                <div className="lp-check">
                  <CheckCircle2 size={17} />
                  <span><strong>Certificates</strong> — shareable proof of completion</span>
                </div>
                <div className="lp-check">
                  <CheckCircle2 size={17} />
                  <span><strong>Community forums</strong> — peer learning built in</span>
                </div>
              </div>
            </div>

            <div className="lp-why-numbers">
              <div className="lp-wn-card">
                <div className="lp-wn-big">10K+</div>
                <div className="lp-wn-label">Active students</div>
              </div>
              <div className="lp-wn-card">
                <div className="lp-wn-big">500+</div>
                <div className="lp-wn-label">Qualified teachers</div>
              </div>
              <div className="lp-wn-card">
                <div className="lp-wn-big">2K+</div>
                <div className="lp-wn-label">Courses available</div>
              </div>
              <div className="lp-wn-card lp-wn-accent">
                <div className="lp-wn-big">4</div>
                <div className="lp-wn-label">User roles supported</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="lp-cta">
        <div className="lp-container">
          <div className="lp-cta-inner">
            <div className="lp-cta-text">
              <h2>Ready to get started?</h2>
              <p>Join Ta3afi Education and transform the way your school learns.</p>
            </div>
            <div className="lp-cta-actions">
              <Link to="/signup" className="lp-btn-primary lp-btn-lg">
                Create free account <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="lp-cta-signin">
                Already have an account? Sign in <ChevronRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-inner">
            <div className="lp-footer-brand">
              <img src="/Logo Vertical.png" alt="Ta3afi Education" className="lp-footer-logo" />
              <p>A modern educational platform for students, teachers, and parents.</p>
            </div>
            <div className="lp-footer-col">
              <div className="lp-footer-col-title">Platform</div>
              <Link to="/courses">Courses</Link>
              <Link to="/teachers">Teachers</Link>
              <Link to="/blog">Blog</Link>
            </div>
            <div className="lp-footer-col">
              <div className="lp-footer-col-title">Account</div>
              <Link to="/login">Sign in</Link>
              <Link to="/signup">Sign up free</Link>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <span>© {new Date().getFullYear()} Ta3afi Education. All rights reserved.</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
