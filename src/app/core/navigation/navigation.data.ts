import { FuseNavigationItem } from '@fuse/components/navigation';
import { cloneDeep } from 'lodash-es';
import { Navigation } from './navigation.types';

const menu: FuseNavigationItem[] = [
  {
    id: 'recipes',
    title: 'Recipes',
    type: 'basic',
    icon: 'heroicons_outline:beaker',
    link: '/recipes',
  },
  {
    id: 'ingredients',
    title: 'Ingredients',
    type: 'basic',
    icon: 'heroicons_outline:puzzle-piece',
    link: '/ingredients',
  },
  {
    id: 'ingredient-lists',
    title: 'Ingredient lists',
    type: 'basic',
    icon: 'heroicons_outline:queue-list',
    link: '/ingredient-lists',
  },
  {
    id: 'recipes-generator',
    title: 'Recipes generator',
    type: 'basic',
    icon: 'heroicons_outline:calculator',
    link: '/recipes-generator',
  },
  {
    id: 'statistics',
    title: 'Statistics',
    type: 'basic',
    icon: 'heroicons_outline:chart-bar',
    link: '/statistics',
  },
];

export function createAppNavigation(): Navigation {
  return {
    compact: cloneDeep(menu),
    default: cloneDeep(menu),
    futuristic: cloneDeep(menu),
    horizontal: cloneDeep(menu),
  };
}
