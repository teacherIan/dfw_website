import type { ProductImage } from '../components/gallery/image_info';
import {
  BUSINESS_COUNTRY,
  BUSINESS_EMAIL,
  BUSINESS_FACEBOOK,
  BUSINESS_LOCALITY,
  BUSINESS_PHONE,
  BUSINESS_REGION,
  DEFAULT_OG_IMAGE,
  LOGO_IMAGE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  canonicalUrl,
} from './siteMetadata';

type JsonLd = Record<string, unknown>;

export const localBusinessSchema = (): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': `${SITE_URL}/#business`,
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  image: DEFAULT_OG_IMAGE,
  logo: LOGO_IMAGE,
  telephone: BUSINESS_PHONE,
  email: BUSINESS_EMAIL,
  address: {
    '@type': 'PostalAddress',
    addressLocality: BUSINESS_LOCALITY,
    addressRegion: BUSINESS_REGION,
    addressCountry: BUSINESS_COUNTRY,
  },
  priceRange: '$$-$$$',
  sameAs: [BUSINESS_FACEBOOK],
});

export const aboutPageSchema = (): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: `About ${SITE_NAME}`,
  url: canonicalUrl('/ethos'),
  mainEntity: { '@id': `${SITE_URL}/#business` },
});

export const contactPageSchema = (): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: `Contact ${SITE_NAME}`,
  url: canonicalUrl('/contact'),
  mainEntity: { '@id': `${SITE_URL}/#business` },
});

export const collectionPageSchema = (): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: `${SITE_NAME} Gallery`,
  description:
    'Browse handcrafted chairs, tables, and architectural pieces by Doug Malloy.',
  url: canonicalUrl('/gallery'),
  isPartOf: { '@id': `${SITE_URL}/#business` },
});

const parsePriceRange = (
  price: string | undefined,
): { low: number; high: number } | null => {
  if (!price) return null;
  const matches = price.match(/[\d,]+/g);
  if (!matches) return null;
  const nums = matches
    .map((s) => Number.parseInt(s.replace(/,/g, ''), 10))
    .filter((n) => Number.isFinite(n));
  if (nums.length === 0) return null;
  if (nums.length === 1) return { low: nums[0], high: nums[0] };
  return { low: Math.min(...nums), high: Math.max(...nums) };
};

export const productSchema = (
  product: ProductImage,
  slug: string,
  absoluteImageUrl: string,
): JsonLd => {
  const priceRange = parsePriceRange(product.price);
  const url = canonicalUrl(`/gallery/${slug}`);

  const offers = priceRange
    ? priceRange.low === priceRange.high
      ? {
          '@type': 'Offer',
          priceCurrency: 'USD',
          price: priceRange.low,
          availability: 'https://schema.org/MadeToOrder',
          url,
          seller: { '@type': 'Organization', name: SITE_NAME },
        }
      : {
          '@type': 'AggregateOffer',
          priceCurrency: 'USD',
          lowPrice: priceRange.low,
          highPrice: priceRange.high,
          availability: 'https://schema.org/MadeToOrder',
          url,
          seller: { '@type': 'Organization', name: SITE_NAME },
        }
    : undefined;

  const schema: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: absoluteImageUrl,
    url,
    sku: product.orderNumber,
    brand: { '@type': 'Brand', name: SITE_NAME },
    category: product.type,
  };

  if (offers) schema.offers = offers;
  return schema;
};
