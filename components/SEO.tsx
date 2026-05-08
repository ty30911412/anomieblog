import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

const SEO: React.FC<SEOProps> = ({ 
  title, 
  description, 
  image, 
  url,
  type = 'article' 
}) => {
  const siteTitle = '阿諾米anomie';
  const defaultDescription = '一個關於社會科學科普與個人生活隨筆的溫暖角落。';
  const defaultImage = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=1000'; // Default sharing image
  
  // Construct full title
  const fullTitle = title ? `${title} | 阿諾米anomie` : siteTitle;
  const metaDescription = description || defaultDescription;
  const metaImage = image || defaultImage;
  const metaUrl = url || window.location.href;

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={metaUrl} />

      {/* Open Graph / Facebook / Line */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:url" content={metaUrl} />
      <meta property="og:site_name" content="阿諾米anomie" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
    </Helmet>
  );
};

export default SEO;
