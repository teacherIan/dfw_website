import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAnimationStore } from '../stores';
import { SCENE_PATH, pathToScene } from '../constants/scenes';
import { useGallery } from '../contexts/GalleryContext';
import {
  getImageBySlug,
  getImagesForCategory,
  getCategoryFromType,
  productSlug,
} from '../components/gallery/image_info';

/**
 * Binds the URL to scene + gallery state. URL is a projection of state,
 * not a source of truth.
 *
 * Routing matrix:
 *   /                      -> home scene
 *   /ethos                 -> ethos scene (overlay)
 *   /contact               -> contact scene (overlay)
 *   /gallery               -> gallery scene, picker/grid
 *   /gallery/<product-slug> -> gallery scene, photo viewer open on that product
 *
 * Cold load skips intro/exit animations and lands directly at the URL's
 * target state — required for deep links and prerender snapshots.
 */
export function useRouteSceneSync() {
  const navigate = useNavigate();
  const location = useLocation();
  const gallery = useGallery();
  const coldLoadHandled = useRef(false);

  useEffect(() => {
    if (coldLoadHandled.current) return;
    coldLoadHandled.current = true;

    const pathname = window.location.pathname;
    const scene = pathToScene(pathname);

    if (scene === 'contact') {
      useAnimationStore.setState({
        isContactOverlayOpen: true,
        loadingComplete: true,
        hasNavigated: true,
        showText: true,
      });
    } else if (scene !== 'home') {
      useAnimationStore.setState({
        activeScene: scene,
        targetScene: scene,
        animationPhase: 'idle',
        hasNavigated: true,
        showText: true,
        loadingComplete: true,
      });
    }

    if (pathname.startsWith('/gallery/')) {
      const slug = pathname.replace(/^\/gallery\//, '').replace(/\/+$/, '');
      if (slug) {
        const product = getImageBySlug(slug);
        if (product) {
          const category = getCategoryFromType(product.type);
          if (category) {
            const products = getImagesForCategory(category);
            const index = products.findIndex((p) => productSlug(p) === slug);
            if (index >= 0) {
              gallery.setSelectedCategory(category);
              gallery.setSelectedImageIndex(index);
              gallery.setViewState('viewing');
            }
          }
        }
      }
    }
  }, [gallery]);

  useEffect(() => {
    const unsubscribe = useAnimationStore.subscribe((state, prev) => {
      if (state.isContactOverlayOpen !== prev.isContactOverlayOpen) {
        if (state.isContactOverlayOpen && window.location.pathname !== '/contact') {
          navigate('/contact');
          return;
        }
        if (!state.isContactOverlayOpen && window.location.pathname === '/contact') {
          navigate('/');
          return;
        }
      }

      if (state.targetScene !== prev.targetScene) {
        const desiredPath = SCENE_PATH[state.targetScene];
        if (window.location.pathname !== desiredPath) {
          navigate(desiredPath);
        }
      } else if (
        state.activeScene !== prev.activeScene &&
        state.activeScene === 'home' &&
        window.location.pathname !== '/' &&
        window.location.pathname !== '/contact'
      ) {
        navigate('/');
      }
    });
    return unsubscribe;
  }, [navigate]);

  useEffect(() => {
    const scene = pathToScene(location.pathname);
    const state = useAnimationStore.getState();

    if (scene === 'contact' && !state.isContactOverlayOpen) {
      state.toggleContactOverlay();
      return;
    }

    if (scene !== 'contact' && state.isContactOverlayOpen) {
      state.toggleContactOverlay();
    }

    if (
      scene === 'home' &&
      state.activeScene !== 'home' &&
      state.animationPhase === 'idle'
    ) {
      state.returnHome();
    }
  }, [location.pathname]);

  useEffect(() => {
    if (
      gallery.viewState === 'viewing' &&
      gallery.selectedCategory &&
      gallery.selectedImageIndex !== null
    ) {
      const products = getImagesForCategory(gallery.selectedCategory);
      const product = products[gallery.selectedImageIndex];
      if (product) {
        const desiredPath = `/gallery/${productSlug(product)}`;
        if (window.location.pathname !== desiredPath) {
          navigate(desiredPath);
        }
      }
      return;
    }

    const pathname = window.location.pathname;
    if (
      pathname.startsWith('/gallery/') &&
      pathname !== '/gallery' &&
      useAnimationStore.getState().activeScene === 'gallery'
    ) {
      navigate('/gallery');
    }
  }, [
    gallery.viewState,
    gallery.selectedCategory,
    gallery.selectedImageIndex,
    navigate,
  ]);
}
