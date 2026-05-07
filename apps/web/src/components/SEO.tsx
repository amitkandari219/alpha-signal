/**
 * SEO Component
 *
 * Manages document head meta tags for SEO optimization
 * Includes Open Graph and Twitter Card support
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  canonical?: string;
  noindex?: boolean;
  jsonLd?: object;
}

const DEFAULT_OG_IMAGE = 'https://alphasignal.in/og-default.png'; // Placeholder
const SITE_URL = 'https://alphasignal.in';

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  canonical,
  noindex = false,
  jsonLd,
}) => {
  // Construct full title
  const fullTitle = title.includes('Alpha Signal') ? title : `${title} | Alpha Signal`;

  // Construct canonical URL
  const canonicalUrl = canonical
    ? (canonical.startsWith('http') ? canonical : `${SITE_URL}${canonical}`)
    : undefined;

  // Construct og:url from canonical or current URL
  const ogUrl = canonicalUrl || (typeof window !== 'undefined' ? window.location.href : SITE_URL);

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />

      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Robots */}
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={ogUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="Alpha Signal" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            ...jsonLd,
          })}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
