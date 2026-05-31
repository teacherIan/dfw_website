import playSet from '../../../gallery/cropped/hobbit_house.jpg';
import fort_b from '../../../gallery/fort_b.jpg';
import hobbit_house_b from '../../../gallery/structures/hobbit_house.jpg';
import hobbitHouseDark from '../../../gallery/structures/hobbit_house_dark.jpg';
import new_hob from '../../../gallery/structures/new_hob_highRise.jpg';
import fort_w_child from '../../../gallery/structures/fort_w_child.png';
import outsideStorage from '../../../gallery/structures/outside_storage.jpeg';
import tree_house_steps from '../../../gallery/structures/tree_house_steps.jpg';
import hobbit_A from '../../../gallery/structures/hobbit_a.jpg';
import hobbit_B from '../../../gallery/structures/hobbit_b.jpg';
import hobbit_C from '../../../gallery/structures/hobbit_c.jpg';
import playhouse from '../../../gallery/structures/playhouse.jpg';
import play_house_2 from '../../../gallery/structures/play_house_2.jpg';
import play_house_3 from '../../../gallery/structures/play_house_3.jpg';

import types, { type ProductImage } from './types';

// Shared product copy — reused across several entries in this category.
const HOBBIT_HOUSE =
  'The Hobbit House playhouse was designed with input from the teachers at the Tufts University Eliot Pearson Children\'s School. The house is designed so that children can use it in a variety of ways: to play store, as a jungle gym with passageways, and as a kid-sized place to sit with their friends.';
const FORT =
  'This product will be built to the needs of the buyer. The one shown is the base unit and contains two platforms of different heights with an inclined ramp connecting them. Options include sunken stumps to walk on, slides, swings, and a curved roof.';
const PLAY_HOUSE =
  'Each play house is custom-built to the needs of the family and the site. Built from Found Wood and finished to weather the elements, they can combine laddered lookouts, a slide, a swing, and a hobbit-house-style roof.';

export default [
  {
    orderNumber: '006',
    img: playSet,
    type: types.structure,
    name: 'Play Set',
    description:
      'The play sets have all varied with the needs of the families. They may contain two laddered lookouts, each with portholes to spy on the other. Between them there can be a swing and a trapeze. Available also are a hobbit house style roof and a slide.',
    price: '$15,000 ~ $20,000',
  },
  {
    orderNumber: '011',
    img: fort_b,
    type: types.structure,
    name: 'Fort',
    description: FORT,
    price: '$10,000 ~ $20,000',
  },
  {
    orderNumber: '015',
    img: hobbit_house_b,
    type: types.structure,
    name: 'Hobbit House',
    description: HOBBIT_HOUSE,
    price: '$15,000 ~ $20,000',
  },
  {
    orderNumber: '020',
    img: hobbitHouseDark,
    type: types.structure,
    name: 'Hobbit House',
    description: HOBBIT_HOUSE,
    price: '$15,000 ~ $20,000',
  },
  {
    orderNumber: '029',
    img: new_hob,
    type: types.structure,
    name: 'Hobbit House',
    description: HOBBIT_HOUSE,
    price: '$15,000 ~ $20,000',
  },
  {
    orderNumber: '030',
    img: fort_w_child,
    type: types.structure,
    name: 'Hobbit House',
    description: HOBBIT_HOUSE,
    price: '$10,000 ~ $20,000',
  },
  {
    orderNumber: '018',
    img: outsideStorage,
    type: types.structure,
    name: 'Outdoor Storage',
    description:
      'Outdoor storage units can be constructed using various types of wood and shapes designed to match the surrounding area or buildings. The storage units are finished with the Found Wood finish which protects the wood from the elements.',
    price: '$3,000',
  },
  {
    orderNumber: '026',
    img: tree_house_steps,
    type: types.structure,
    name: 'Hobbit House',
    description: HOBBIT_HOUSE,
    price: '$15,000 ~ $20,000',
  },
  {
    orderNumber: '031',
    img: hobbit_A,
    type: types.structure,
    name: 'Hobbit House',
    description: HOBBIT_HOUSE,
    price: '$15,000 ~ $20,000',
  },
  {
    orderNumber: '032',
    img: hobbit_B,
    type: types.structure,
    name: 'Hobbit House',
    description: HOBBIT_HOUSE,
    price: '$15,000 ~ $20,000',
  },
  {
    orderNumber: '033',
    img: hobbit_C,
    type: types.structure,
    name: 'Hobbit House',
    description: HOBBIT_HOUSE,
    price: '$15,000 ~ $20,000',
  },
  {
    orderNumber: '034',
    img: playhouse,
    type: types.structure,
    name: 'Play House',
    description: PLAY_HOUSE,
    price: '$15,000 ~ $20,000',
  },
  {
    orderNumber: '035',
    img: play_house_2,
    type: types.structure,
    name: 'Play House',
    description: PLAY_HOUSE,
    price: '$15,000 ~ $20,000',
  },
  {
    orderNumber: '036',
    img: play_house_3,
    type: types.structure,
    name: 'Play House',
    description: PLAY_HOUSE,
    price: '$15,000 ~ $20,000',
  },
] satisfies ProductImage[];
