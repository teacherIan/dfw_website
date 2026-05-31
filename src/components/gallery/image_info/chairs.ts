import doubleChair from '../../../gallery/chairs/real_double_chair.png';
import captainChair from '../../../gallery/chairs/real_high_chair.png';
import gaudiChair from '../../../gallery/chairs/double_seat.png';
import adirondack_chair_w_stool from '../../../gallery/chairs/chair_w_stool.png';
import outside_adirondack_chair from '../../../gallery/chairs/Adirondack_chair.jpeg';
import swingA from '../../../gallery/chairs/swing_a.jpg';
import swingB from '../../../gallery/chairs/swingB.jpeg';
import swingC from '../../../gallery/chairs/swingC.jpeg';
import love_seat from '../../../gallery/chairs/love_seat.jpeg';
import types, { type ProductImage } from './types';

// Shared product copy — reused across several entries in this category.
const ADIRONDACK_CHAIR =
  'This comfortable chair has white cedar uprights cut and shaped for lumbar support and 6/4" cedar arms, screwed together and covered with mahogany plugs. Built to last with four coats of spar varnish heated into the wood. For indoor or sheltered use, a different, richer finish is available.';
const FOUND_WOOD_SWING =
  'The Found Wood Swing is made with 5/4 red cedar slats, mahogany plugs, and white cedar uprights. It is finished with multiple coats of spar varnish that is heated and rubbed in for lasting protection.';
const ADIRONDACK_LOVESEAT =
  'Like the Adirondack Chair, this loveseat is made with 5/4 red cedar slats, mahogany plugs, and white cedar uprights. It is finished with multiple coats of spar varnish that is heated and rubbed in.';

export default [
  {
    orderNumber: '002',
    img: doubleChair,
    type: types.chairs,
    name: 'Adirondack Loveseat',
    description: ADIRONDACK_LOVESEAT,
    price: '$1,400 ~ $2,000',
  },
  {
    orderNumber: '003',
    img: captainChair,
    type: types.chairs,
    name: 'Captain Chair',
    description:
      'Like the Adirondack Chair, the Captain\'s Chair is made with 5/4 red cedar slats, mahogany plugs, and white cedar uprights. It is finished with multiple coats of Found Wood varnish, heated and rubbed in to protect from the elements. This chair is raised for superior views of the surrounding area and above porch railings.',
    price: '$1,400 ~ $2,000',
  },
  {
    orderNumber: '007',
    img: gaudiChair,
    type: types.chairs,
    name: 'Gaudi Chair',
    description:
      'This double chair was inspired by the architect Gaudi. The angled seats allow two people to have an intimate conversation - when sitting back, their heads are close enough to talk in whispers. The chair is done entirely in cedar with five coats of finish and mahogany plugs.',
    price: '$1,400 ~ $2,000',
  },
  {
    orderNumber: '014',
    img: adirondack_chair_w_stool,
    type: types.chairs,
    name: 'Adirondack Chair with Ottoman',
    description: ADIRONDACK_CHAIR,
    price: '$1,400 ~ $2,000',
  },
  {
    orderNumber: '028',
    img: outside_adirondack_chair,
    type: types.chairs,
    name: 'Adirondack Chair',
    description: ADIRONDACK_CHAIR,
    price: '$1,400 ~ $2,000',
  },
  {
    orderNumber: '019',
    img: swingA,
    type: types.chairs,
    name: 'Found Wood Swing',
    description: FOUND_WOOD_SWING,
    price: '$1,400 ~ $2,000',
  },
  {
    orderNumber: '021',
    img: swingB,
    type: types.chairs,
    name: 'Found Wood Swing',
    description: FOUND_WOOD_SWING,
    price: '$1,400 ~ $2,000',
  },
  {
    orderNumber: '022',
    img: swingC,
    type: types.chairs,
    name: 'Found Wood Swing',
    description: FOUND_WOOD_SWING,
    price: '$1,400 ~ $2,000',
  },
  {
    orderNumber: '032',
    img: love_seat,
    type: types.chairs,
    name: 'Adirondack Loveseat',
    description: ADIRONDACK_LOVESEAT,
    price: '$1,400 ~ $2,000',
  },
] satisfies ProductImage[];
