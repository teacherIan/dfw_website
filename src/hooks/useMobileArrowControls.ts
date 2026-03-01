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


// Default values - all breakpoints start with mid values, adjust tablet/ipadPro as needed
const ARROW_DEFAULTS = {
  ethos: {
    small: { startX: -46, startY: 18, ctrlX: -66, ctrlY: -100, endX: 148, endY: -85, angleOffset: -4 },
    mid: { startX: -46, startY: 18, ctrlX: -66, ctrlY: -100, endX: 148, endY: -85, angleOffset: -4 },
    tablet: { startX: -46, startY: 18, ctrlX: -66, ctrlY: -100, endX: 148, endY: -85, angleOffset: -4 },
    ipadPro: { startX: -46, startY: 18, ctrlX: -66, ctrlY: -100, endX: 148, endY: -85, angleOffset: -4 },
  },
  contact: {
    small: { startX: -13, startY: -11, ctrlX: -100, ctrlY: 70, endX: 6, endY: 103, angleOffset: 0 },
    mid: { startX: -13, startY: -11, ctrlX: -100, ctrlY: 70, endX: 6, endY: 103, angleOffset: 0 },
    tablet: { startX: -13, startY: -11, ctrlX: -100, ctrlY: 70, endX: 6, endY: 103, angleOffset: 0 },
    ipadPro: { startX: -13, startY: -11, ctrlX: -100, ctrlY: 70, endX: 6, endY: 103, angleOffset: 0 },
  },
  gallery: {
    small: { startX: 63, startY: 100, ctrlX: -10, ctrlY: 79, endX: 131, endY: -10, angleOffset: 0 },
    mid: { startX: 63, startY: 100, ctrlX: -10, ctrlY: 79, endX: 131, endY: -10, angleOffset: 0 },
    tablet: { startX: 63, startY: 100, ctrlX: -10, ctrlY: 79, endX: 131, endY: -10, angleOffset: 0 },
    ipadPro: { startX: 63, startY: 100, ctrlX: -10, ctrlY: 79, endX: 131, endY: -10, angleOffset: 0 },
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
