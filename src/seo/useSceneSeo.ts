import { useHead } from '@unhead/react';
import { useAnimationStore } from '../stores';
import { useGallery } from '../contexts/GalleryContext';
import {
  getImagesForCategory,
  productSlug,
} from '../components/gallery/image_info';
import {
  DEFAULT_OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  canonicalUrl,
} from './siteMetadata';
import {
  aboutPageSchema,
  collectionPageSchema,
  contactPageSchema,
  localBusinessSchema,
  productSchema,
} from './schemas';

interface SceneMeta {
  title: string;
  description: string;
  path: string;
  ogImage: string;
  jsonLd: Record<string, unknown>[];
}

const homeMeta = (): SceneMeta => ({
  title: `${SITE_NAME} — Handcrafted Furniture from Athens, Maine`,
  description: SITE_DESCRIPTION,
  path: '/',
  ogImage: DEFAULT_OG_IMAGE,
  jsonLd: [localBusinessSchema()],
});

const ethosMeta = (): SceneMeta => ({
  title: `Ethos — ${SITE_NAME}`,
  description:
    "Our approach to woodworking: reclaimed and responsibly sourced wood, traditional joinery, and multi-coat spar-varnish finishes built for Maine weather.",
  path: '/ethos',
  ogImage: DEFAULT_OG_IMAGE,
  jsonLd: [localBusinessSchema(), aboutPageSchema()],
});

const contactMeta = (): SceneMeta => ({
  title: `Contact — ${SITE_NAME}`,
  description: `Commission handcrafted furniture from Doug's Found Wood in Athens, Maine. Call (207) 654-2692 or email matfoundwood@gmail.com.`,
  path: '/contact',
  ogImage: DEFAULT_OG_IMAGE,
  jsonLd: [localBusinessSchema(), contactPageSchema()],
});

const galleryMeta = (): SceneMeta => ({
  title: `Gallery — ${SITE_NAME}`,
  description:
    "Browse handcrafted chairs, tables, swings, and architectural pieces by Doug Malloy — from Adirondack loveseats to live-edge tables.",
  path: '/gallery',
  ogImage: DEFAULT_OG_IMAGE,
  jsonLd: [localBusinessSchema(), collectionPageSchema()],
});

/**
 * Calls useHead with metadata derived from the current scene + gallery state.
 * Exactly one useHead call runs per render, so downstream head entries all
 * resolve through a single keyed source.
 */
export function useSceneSeo() {
  const activeScene = useAnimationStore((s) => s.activeScene);
  const isContactOverlayOpen = useAnimationStore((s) => s.isContactOverlayOpen);
  const gallery = useGallery();

  let meta: SceneMeta;

  if (isContactOverlayOpen) {
    meta = contactMeta();
  } else if (
    activeScene === 'gallery' &&
    gallery.viewState === 'viewing' &&
    gallery.selectedCategory &&
    gallery.selectedImageIndex !== null
  ) {
    const products = getImagesForCategory(gallery.selectedCategory);
    const product = products[gallery.selectedImageIndex];
    if (product) {
      const slug = productSlug(product);
      const absoluteImage = product.img.startsWith('http')
        ? product.img
        : `${SITE_URL}${product.img.startsWith('/') ? '' : '/'}${product.img}`;
      meta = {
        title: `${product.name} — ${SITE_NAME}`,
        description: product.description,
        path: `/gallery/${slug}`,
        ogImage: absoluteImage,
        jsonLd: [
          localBusinessSchema(),
          productSchema(product, slug, absoluteImage),
        ],
      };
    } else {
      meta = galleryMeta();
    }
  } else if (activeScene === 'gallery') {
    meta = galleryMeta();
  } else if (activeScene === 'ethos') {
    meta = ethosMeta();
  } else if (activeScene === 'contact') {
    meta = contactMeta();
  } else {
    meta = homeMeta();
  }

  const url = canonicalUrl(meta.path);

  useHead({
    title: meta.title,
    meta: [
      { name: 'description', content: meta.description },
      { property: 'og:title', content: meta.title },
      { property: 'og:description', content: meta.description },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: url },
      { property: 'og:image', content: meta.ogImage },
      { property: 'og:site_name', content: SITE_NAME },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: meta.title },
      { name: 'twitter:description', content: meta.description },
      { name: 'twitter:image', content: meta.ogImage },
    ],
    link: [{ rel: 'canonical', href: url }],
    script: meta.jsonLd.map((schema) => ({
      type: 'application/ld+json',
      innerHTML: JSON.stringify(schema),
    })),
  });
}
