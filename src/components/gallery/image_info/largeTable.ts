import types, { type ProductImage } from './types';
import kidsPicnicTable from '../../../gallery/real_picnic_table_rotated.png';
import adult_picnic_table from '../../../gallery/large_tables/adult_picnic_table.png';
import picnicTableC from '../../../gallery/large_tables/picnic_table_b.jpg';
import diningTableTop from '../../../gallery/large_tables/dining_table_overhead.jpeg';
import diningTableUnder from '../../../gallery/large_tables/dining_table_under.jpeg';
import glass_table from '../../../gallery/large_tables/small_table.jpg';

// Shared product copy — reused across several entries in this category.
const PICNIC_TABLE =
  'This large picnic table is made of Maine white cedar roots and planks, custom built to a variety of heights, lengths, and widths.';

export default [
  {
    orderNumber: '304',
    img: kidsPicnicTable,
    type: types.largeTable,
    name: 'Kids Picnic Table',
    description:
      'Made from natural Maine white cedar roots and planks, this rustic children-sized picnic table blends durability with woodland charm. Its organic root base offers sturdy support, while the smooth, rounded planks ensure safety and comfort—perfect for outdoor play and gatherings.',
    price: '$1,000 ~ $1,500',
  },
  {
    orderNumber: '312',
    img: adult_picnic_table,
    type: types.largeTable,
    name: 'Picnic Table',
    description: PICNIC_TABLE,
    price: '$1,400 ~ $2,000',
  },
  {
    orderNumber: '325',
    img: picnicTableC,
    type: types.largeTable,
    name: 'Picnic Table',
    description: PICNIC_TABLE,
    price: '$1,400 ~ $2,000',
  },
  {
    orderNumber: '335',
    img: diningTableTop,
    type: types.largeTable,
    name: 'Glass Dining Table',
    description:
      'Top view of the glass table. Cedar grows slowly and underground often takes interesting shapes that support a glass top.',
    price: '$2,000 ~ $4,000',
  },
  {
    orderNumber: '336',
    img: diningTableUnder,
    type: types.largeTable,
    name: 'Glass Dining Table',
    description:
      'Pictured is the root system of three interconnected cedar trees. Often the roots of the trees are interconnected and they lend themselves to becoming table bases.',
    price: '$2,000 ~ $4,000',
  },
  {
    orderNumber: '013',
    img: glass_table,
    type: types.largeTable,
    name: 'Glass Table',
    description:
      'Cedar grows slowly and underground often takes interesting shapes that support a glass top.',
    price: '$1,000 ~ $1,200',
  },
] satisfies ProductImage[];
