import type { CSSProperties } from 'react';
import { useAnimationStore } from '../../stores';
import { useGallery } from '../../contexts/GalleryContext';
import {
  categoryLabels,
  getImagesForCategory,
  productSlug,
  type CategoryKey,
} from '../gallery/image_info';
import {
  BUSINESS_EMAIL,
  BUSINESS_FACEBOOK,
  BUSINESS_PHONE,
} from '../../seo/siteMetadata';

const categories: CategoryKey[] = [
  'chairs',
  'large_tables',
  'small_tables',
  'structures',
];

const srOnly: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

/**
 * Renders a visually-hidden but DOM-present semantic tree for the current
 * scene. Ensures crawlers and the prerender snapshot always see an <h1>,
 * descriptive copy, and real anchor tags regardless of overlay animation
 * state.
 */
export default function SeoContent() {
  const activeScene = useAnimationStore((s) => s.activeScene);
  const isContactOverlayOpen = useAnimationStore((s) => s.isContactOverlayOpen);
  const gallery = useGallery();

  const isGalleryProduct =
    activeScene === 'gallery' &&
    gallery.viewState === 'viewing' &&
    gallery.selectedCategory != null &&
    gallery.selectedImageIndex != null;

  return (
    <div style={srOnly}>
      <h1>Doug&apos;s Found Wood</h1>
      <p>
        Handcrafted furniture from Athens, Maine. Adirondack chairs, tables,
        swings, and custom woodworking by Doug Malloy, built to last from cedar
        and hardwoods.
      </p>
      <nav aria-label="Site">
        <a href="/">Home</a>
        <a href="/ethos">Ethos</a>
        <a href="/gallery">Gallery</a>
        <a href="/contact">Contact</a>
      </nav>

      {activeScene === 'ethos' && (
        <section>
          <h2>Our Ethos</h2>
          <p>
            Doug Malloy&apos;s approach blends reclaimed and responsibly
            sourced wood with traditional joinery and multi-coat spar-varnish
            finishes built for Maine weather. Every piece is handcrafted in
            Athens, Maine to last generations.
          </p>
          <p>
            Whether it&apos;s an Adirondack chair, a live-edge table, or a
            four-story timber-frame home, each commission honors the grain,
            the place, and the person it&apos;s built for.
          </p>
        </section>
      )}

      {isContactOverlayOpen && (
        <section>
          <h2>Contact</h2>
          <p>
            Commission a piece, ask about lead times, or visit the workshop in
            Athens, Maine.
          </p>
          <address>
            <a href={`tel:${BUSINESS_PHONE.replace(/[^+\d]/g, '')}`}>
              (207) 654-2692
            </a>
            <a href={`mailto:${BUSINESS_EMAIL}`}>{BUSINESS_EMAIL}</a>
            <a href="mailto:wiffle@tdstelme.net">wiffle@tdstelme.net</a>
            <a href={BUSINESS_FACEBOOK} rel="noopener noreferrer" target="_blank">
              Doug&apos;s Found Wood on Facebook
            </a>
            <span>Athens, ME</span>
          </address>
        </section>
      )}

      {activeScene === 'gallery' && !isGalleryProduct && (
        <section>
          <h2>Gallery</h2>
          <p>
            Browse handcrafted chairs, tables, swings, and architectural pieces
            by Doug Malloy.
          </p>
          {categories.map((cat) => {
            const items = getImagesForCategory(cat);
            if (items.length === 0) return null;
            return (
              <div key={cat}>
                <h3>{categoryLabels[cat]}</h3>
                <ul>
                  {items.map((p) => (
                    <li key={`${cat}-${p.orderNumber}`}>
                      <a href={`/gallery/${productSlug(p)}`}>{p.name}</a>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </section>
      )}

      {isGalleryProduct &&
        gallery.selectedCategory != null &&
        gallery.selectedImageIndex != null &&
        (() => {
          const products = getImagesForCategory(gallery.selectedCategory!);
          const product = products[gallery.selectedImageIndex!];
          if (!product) return null;
          return (
            <section>
              <h2>{product.name}</h2>
              <p>{product.description}</p>
              {product.price && <p>Price: {product.price}</p>}
              <img src={product.img} alt={product.name} />
              <p>
                <a href="/gallery">Back to Gallery</a>
              </p>
            </section>
          );
        })()}
    </div>
  );
}
