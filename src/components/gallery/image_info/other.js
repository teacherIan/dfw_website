import door from '../../../src/assets/gallery/pet_door.jpg';
import dresser from '../../../src/assets/gallery/other/dresser.jpg';
import latch from '../../../src/assets/gallery/other/latch.jpg';
import lightA from '../../../src/assets/gallery/other/lightA.jpeg';

import types from './types';
export default [
  {
    orderNumber: '010',
    img: door,
    name: 'Found Wood Door',
    type: types.other,
    description:
      'Exterior and interior doors can be created in various styles. In some cases, new door frames are included so that non-rectangular doors are possible. Carvings, stained glass, and contrasting wood colors can be added. The rich wood finish appears in the wood rather than on it, thanks to a hand-rubbed application of multiple coats.',
    price: '$1,500 ~ $3,000',
  },
  {
    orderNumber: '016',
    img: dresser,
    name: 'Found Wood Dresser',
    type: types.other,
    description:
      'This dresser combines natural wood beauty with functional storage. Each piece features carefully selected wood with unique grain patterns. The drawers are built with dovetail joints for durability, and the finish is hand-rubbed to bring out the wood\'s natural character.',
    price: '$3,000',
  },
  {
    orderNumber: '017',
    img: latch,
    name: 'Found Wood Latch',
    type: types.other,
    description:
      'These custom wooden latches add a handmade touch to gates, doors, and cabinets. Each latch is carved from solid wood and designed to be both functional and decorative, complementing the rustic aesthetic of Found Wood pieces.',
    price: '$300',
  },
  {
    orderNumber: '023',
    img: lightA,
    name: 'Found Wood Light',
    type: types.other,
    description:
      'This unique light fixture is crafted from natural wood, showcasing organic shapes and textures. The design allows warm light to filter through, creating an inviting ambiance. Each fixture is one-of-a-kind, shaped by the natural forms of the wood.',
    price: '$500',
  },
];
