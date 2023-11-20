import React from 'react';
import type { PlaylistItem } from '@jwplayer/ott-common/types/playlist';
import ApiService from '@jwplayer/ott-common/src/services/api.service';

import { renderWithRouter } from '../../../test/testUtils';

import Cinema from './Cinema';

vi.mock('@jwplayer/ott-common/src/modules/container', () => ({
  getModule: (type: typeof ApiService) => {
    switch (type) {
      case ApiService:
        return {
          getPlaylistById: vi.fn(() => ({
            id: 'fake_id',
          })),
        };
    }
  },
}));

describe('<Cinema>', () => {
  test('renders and matches snapshot', () => {
    const item = {
      description: 'Test item description',
      duration: 354,
      feedid: 'ax85aa',
      image: 'http://test/img.jpg',
      images: [],
      link: 'http://test/link',
      genre: 'Tester',
      mediaid: 'zp50pz',
      pubdate: 26092021,
      rating: 'CC_CC',
      sources: [],
      seriesId: 'ag94ag',
      tags: 'Test tag',
      title: 'Test item title',
      tracks: [],
    } as PlaylistItem;
    const { container } = renderWithRouter(
      <Cinema item={item} onPlay={() => null} onPause={() => null} open={true} title={item.title} primaryMetadata="Primary metadata" />,
    );

    expect(container).toMatchSnapshot();
  });
});