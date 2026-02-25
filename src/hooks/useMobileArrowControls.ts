import { useControls, folder } from 'leva';

type LevaStore = ReturnType<typeof import('leva').useCreateStore>;

interface ArrowPathData {
  startX: number;
  startY: number;
  ctrlX: number;
  ctrlY: number;
  endX: number;
  endY: number;
  angleOffset: number;
}


// Default values from the current MobileArrows.tsx
const ARROW_DEFAULTS = {
  ethos: {
    small: { startX: 118, startY: 90, ctrlX: 60, ctrlY: 60, endX: 77, endY: 11, angleOffset: 0 },
    mid: { startX: 84, startY: 133, ctrlX: -53, ctrlY: 39, endX: 42, endY: -53, angleOffset: -1 },
    tablet: { startX: 110, startY: 135, ctrlX: 70, ctrlY: 55, endX: 102, endY: 2, angleOffset: 0 },
    ipadPro: { startX: 115, startY: 130, ctrlX: 65, ctrlY: 40, endX: 85, endY: -25, angleOffset: 0 },
  },
  contact: {
    small: { startX: 65, startY: 10, ctrlX: 55, ctrlY: 85, endX: 36, endY: 165, angleOffset: 0 },
    mid: { startX: -13, startY: -11, ctrlX: -100, ctrlY: 70, endX: 6, endY: 103, angleOffset: 0 },
    tablet: { startX: 70, startY: 0, ctrlX: 50, ctrlY: 70, endX: 23, endY: 150, angleOffset: 0 },
    ipadPro: { startX: 75, startY: 0, ctrlX: 55, ctrlY: 70, endX: 32, endY: 150, angleOffset: 0 },
  },
  gallery: {
    small: { startX: 20, startY: 95, ctrlX: 90, ctrlY: 75, endX: 180, endY: 42, angleOffset: 0 },
    mid: { startX: 63, startY: 100, ctrlX: -10, ctrlY: 79, endX: 131, endY: -10, angleOffset: 0 },
    tablet: { startX: 5, startY: 95, ctrlX: 90, ctrlY: 65, endX: 187, endY: 48, angleOffset: 0 },
    ipadPro: { startX: 0, startY: 90, ctrlX: 85, ctrlY: 55, endX: 178, endY: 30, angleOffset: 0 },
  },
};

const createPathControls = (defaults: ArrowPathData, breakpointName: string) => ({
  [`${breakpointName}`]: folder({
    startX: { value: defaults.startX, min: -50, max: 250, step: 1, label: 'Start X' },
    startY: { value: defaults.startY, min: -50, max: 250, step: 1, label: 'Start Y' },
    ctrlX: { value: defaults.ctrlX, min: -100, max: 250, step: 1, label: 'Control X' },
    ctrlY: { value: defaults.ctrlY, min: -100, max: 250, step: 1, label: 'Control Y' },
    endX: { value: defaults.endX, min: -100, max: 250, step: 1, label: 'End X' },
    endY: { value: defaults.endY, min: -100, max: 250, step: 1, label: 'End Y' },
    angleOffset: { value: defaults.angleOffset, min: -180, max: 180, step: 1, label: 'Angle Offset' },
  }, { collapsed: true }),
});

export const useEthosArrowControls = (controlsStore?: LevaStore) => {
  const small = useControls({
    '🏹 Ethos Arrow': folder({
      ...createPathControls(ARROW_DEFAULTS.ethos.small, 'Small (<400px)'),
    }, { collapsed: false }),
  }, { store: controlsStore });

  const mid = useControls({
    '🏹 Ethos Arrow': folder({
      ...createPathControls(ARROW_DEFAULTS.ethos.mid, 'Mid (400-699px)'),
    }, { collapsed: false }),
  }, { store: controlsStore });

  const tablet = useControls({
    '🏹 Ethos Arrow': folder({
      ...createPathControls(ARROW_DEFAULTS.ethos.tablet, 'Tablet (700-999px)'),
    }, { collapsed: false }),
  }, { store: controlsStore });

  const ipadPro = useControls({
    '🏹 Ethos Arrow': folder({
      ...createPathControls(ARROW_DEFAULTS.ethos.ipadPro, 'iPad Pro (1000-1199px)'),
    }, { collapsed: false }),
  }, { store: controlsStore });

  return { small, mid, tablet, ipadPro };
};

export const useContactArrowControls = (controlsStore?: LevaStore) => {
  const small = useControls({
    '📧 Contact Arrow': folder({
      ...createPathControls(ARROW_DEFAULTS.contact.small, 'Small (<400px)'),
    }, { collapsed: false }),
  }, { store: controlsStore });

  const mid = useControls({
    '📧 Contact Arrow': folder({
      ...createPathControls(ARROW_DEFAULTS.contact.mid, 'Mid (400-699px)'),
    }, { collapsed: false }),
  }, { store: controlsStore });

  const tablet = useControls({
    '📧 Contact Arrow': folder({
      ...createPathControls(ARROW_DEFAULTS.contact.tablet, 'Tablet (700-999px)'),
    }, { collapsed: false }),
  }, { store: controlsStore });

  const ipadPro = useControls({
    '📧 Contact Arrow': folder({
      ...createPathControls(ARROW_DEFAULTS.contact.ipadPro, 'iPad Pro (1000-1199px)'),
    }, { collapsed: false }),
  }, { store: controlsStore });

  return { small, mid, tablet, ipadPro };
};

export const useGalleryArrowControls = (controlsStore?: LevaStore) => {
  const small = useControls({
    '🖼️ Gallery Arrow': folder({
      ...createPathControls(ARROW_DEFAULTS.gallery.small, 'Small (<400px)'),
    }, { collapsed: false }),
  }, { store: controlsStore });

  const mid = useControls({
    '🖼️ Gallery Arrow': folder({
      ...createPathControls(ARROW_DEFAULTS.gallery.mid, 'Mid (400-699px)'),
    }, { collapsed: false }),
  }, { store: controlsStore });

  const tablet = useControls({
    '🖼️ Gallery Arrow': folder({
      ...createPathControls(ARROW_DEFAULTS.gallery.tablet, 'Tablet (700-999px)'),
    }, { collapsed: false }),
  }, { store: controlsStore });

  const ipadPro = useControls({
    '🖼️ Gallery Arrow': folder({
      ...createPathControls(ARROW_DEFAULTS.gallery.ipadPro, 'iPad Pro (1000-1199px)'),
    }, { collapsed: false }),
  }, { store: controlsStore });

  return { small, mid, tablet, ipadPro };
};
