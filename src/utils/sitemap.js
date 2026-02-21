/**
 * Sitemap generation utility
 * This can be used to generate a sitemap.xml file for SEO purposes
 * 
 * Note: For a production app, you would typically generate this dynamically
 * from your database or API. This is a static example structure.
 */

const BASE_URL = process.env.VITE_BASE_URL || 'https://ta3afi.education';

/**
 * Generate sitemap XML string
 * @param {Array} routes - Array of route objects with {url, lastmod, changefreq, priority}
 * @returns {string} XML sitemap string
 */
export const generateSitemap = (routes = []) => {
  const defaultRoutes = [
    { url: '/', changefreq: 'daily', priority: '1.0' },
    { url: '/courses', changefreq: 'daily', priority: '0.9' },
    { url: '/teachers', changefreq: 'daily', priority: '0.9' },
    { url: '/blog', changefreq: 'daily', priority: '0.8' },
    { url: '/community', changefreq: 'daily', priority: '0.7' },
    { url: '/qa', changefreq: 'weekly', priority: '0.7' },
  ];

  const allRoutes = [...defaultRoutes, ...routes];
  const currentDate = new Date().toISOString().split('T')[0];

  const urlEntries = allRoutes.map(route => {
    const url = route.url.startsWith('http') ? route.url : `${BASE_URL}${route.url}`;
    const lastmod = route.lastmod || currentDate;
    const changefreq = route.changefreq || 'weekly';
    const priority = route.priority || '0.5';

    return `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
};

/**
 * Generate sitemap for courses
 * @param {Array} courses - Array of course objects
 * @returns {Array} Array of route objects for sitemap
 */
export const generateCourseSitemap = (courses = []) => {
  return courses.map(course => ({
    url: `/courses/${course.id || course.courseID}`,
    lastmod: course.updatedAt || course.createdAt || new Date().toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: '0.8',
  }));
};

/**
 * Generate sitemap for blog articles
 * @param {Array} articles - Array of article objects
 * @returns {Array} Array of route objects for sitemap
 */
export const generateArticleSitemap = (articles = []) => {
  return articles.map(article => ({
    url: `/blog/${article.id || article.articleID}`,
    lastmod: article.updatedAt || article.date || article.createdAt || new Date().toISOString().split('T')[0],
    changefreq: 'monthly',
    priority: '0.7',
  }));
};

/**
 * Generate sitemap for teachers
 * @param {Array} teachers - Array of teacher objects
 * @returns {Array} Array of route objects for sitemap
 */
export const generateTeacherSitemap = (teachers = []) => {
  return teachers.map(teacher => ({
    url: `/teachers/${teacher.id || teacher.teacherID}`,
    lastmod: teacher.updatedAt || teacher.createdAt || new Date().toISOString().split('T')[0],
    changefreq: 'monthly',
    priority: '0.7',
  }));
};

/**
 * Complete sitemap generator
 * Combines all routes into a single sitemap
 * @param {Object} data - Object containing courses, articles, teachers arrays
 * @returns {string} Complete sitemap XML
 */
export const generateCompleteSitemap = (data = {}) => {
  const { courses = [], articles = [], teachers = [] } = data;
  
  const courseRoutes = generateCourseSitemap(courses);
  const articleRoutes = generateArticleSitemap(articles);
  const teacherRoutes = generateTeacherSitemap(teachers);
  
  const allRoutes = [...courseRoutes, ...articleRoutes, ...teacherRoutes];
  
  return generateSitemap(allRoutes);
};

