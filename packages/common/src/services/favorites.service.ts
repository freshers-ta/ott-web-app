import { injectable } from 'inversify';

import { MAX_WATCHLIST_ITEMS_COUNT } from '../constants';
import * as persist from '../utils/persist';
import type { Favorite, SerializedFavorite } from '../../types/favorite';
import type { PlaylistItem } from '../../types/playlist';
import type { Customer } from '../../types/account';

import ApiService from './api.service';

@injectable()
export default class FavoritesService {
  private MAX_FAVORITES_COUNT = 48;
  private PERSIST_KEY_FAVORITES = `favorites${window.configId ? `-${window.configId}` : ''}`;

  private readonly apiService;

  constructor(apiService: ApiService) {
    this.apiService = apiService;
  }

  getFavorites = async (user: Customer | null, favoritesList: string) => {
    const savedItems = user ? user.externalData?.favorites : persist.getItem<Favorite[]>(this.PERSIST_KEY_FAVORITES);

    if (savedItems?.length) {
      const playlistItems = await this.apiService.getMediaByWatchlist(
        favoritesList,
        savedItems.map(({ mediaid }) => mediaid),
      );

      return (playlistItems || []).map((item) => this.createFavorite(item));
    }
  };

  serializeFavorites = (favorites: Favorite[]): SerializedFavorite[] => {
    return favorites.map(({ mediaid }) => ({ mediaid }));
  };

  persistFavorites = (favorites: Favorite[]) => {
    persist.setItem(this.PERSIST_KEY_FAVORITES, this.serializeFavorites(favorites));
  };

  getMaxFavoritesCount = () => {
    return this.MAX_FAVORITES_COUNT;
  };

  hasReachedFavoritesLimit = (favorites: Favorite[]) => {
    return favorites?.length >= MAX_WATCHLIST_ITEMS_COUNT;
  };

  createFavorite = (item: PlaylistItem): Favorite => {
    return {
      mediaid: item.mediaid,
      title: item.title,
      tags: item.tags,
      duration: item.duration,
      playlistItem: item,
    } as Favorite;
  };
}