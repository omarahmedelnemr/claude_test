import { Helmet } from 'react-helmet-async';

/**
 * SEO Component for managing meta tags, Open Graph, Twitter Cards, and structured data
 * 
 * @param {Object} props
 * @param {string} props.title - Page title (default: "Ta3afi Education - Online Learning Platform")
 * @param {string} props.description - Meta description
 * @param {string} props.keywords - Comma-separated keywords
 * @param {string} props.image - Open Graph image URL
 * @param {string} props.url - Canonical URL
 * @param {string} props.type - Open Graph type (article, website, profile, etc.)
 * @param {Object} props.article - Article-specific meta (author, publishedTime, modifiedTime, section)
 * @param {Object} props.profile - Profile-specific meta (firstName, lastName, username)
 * @param {Object} props.structuredData - JSON-LD structured data object
 * @param {boolean} props.noindex - Whether to prevent indexing
 * @param {boolean} props.nofollow - Whether to prevent following links
 */
const SEO = ({
  title = 'Ta3afi Education - Online Learning Platform',
  description = 'Ta3afi Education is a comprehensive online learning platform connecting students, teachers, and parents. Browse courses, learn from expert teachers, and track your progress.',
  keywords = 'online education, e-learning, courses, teachers, students, online learning platform, education technology',
  image = '/Logo Vertical.png',
  url,
  type = 'website',
  article = null,
  profile = null,
  structuredData = null,
  noindex = false,
  nofollow = false,
}) => {
  // Get base URL from environment or use current origin
  const baseUrl = import.meta.env.VITE_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  const fullUrl = url ? (url.startsWith('http') ? url : `${baseUrl}${url}`) : (typeof window !== 'undefined' ? window.location.href : baseUrl);
  const fullImageUrl = image ? (image.startsWith('http') ? image : `${baseUrl}${image}`) : `${baseUrl}/Logo Vertical.png`;

  // Build title with site name
  const fullTitle = title.includes('Ta3afi Education') ? title : `${title} | Ta3afi Education`;

  // Robots meta
  const robotsContent = [
    noindex ? 'noindex' : 'index',
    nofollow ? 'nofollow' : 'follow',
  ].join(', ');

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={robotsContent} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph Meta Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content="Ta3afi Education" />

      {/* Article-specific Open Graph tags */}
      {article && (
        <>
          {article.author && <meta property="article:author" content={article.author} />}
          {article.publishedTime && <meta property="article:published_time" content={article.publishedTime} />}
          {article.modifiedTime && <meta property="article:modified_time" content={article.modifiedTime} />}
          {article.section && <meta property="article:section" content={article.section} />}
          {article.tags && article.tags.map((tag, index) => (
            <meta key={index} property="article:tag" content={tag} />
          ))}
        </>
      )}

      {/* Profile-specific Open Graph tags */}
      {profile && (
        <>
          {profile.firstName && <meta property="profile:first_name" content={profile.firstName} />}
          {profile.lastName && <meta property="profile:last_name" content={profile.lastName} />}
          {profile.username && <meta property="profile:username" content={profile.username} />}
        </>
      )}

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />

      {/* Structured Data (JSON-LD) */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;

