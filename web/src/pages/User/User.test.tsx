import { act } from '@testing-library/react';
import type { Playlist, PlaylistItem } from '@jwplayer/ott-common/types/playlist';
import type { Config } from '@jwplayer/ott-common/types/config';
import type { PaymentDetail, Subscription, Transaction } from '@jwplayer/ott-common/types/subscription';
import { useAccountStore } from '@jwplayer/ott-common/src/stores/AccountStore';
import { useConfigStore } from '@jwplayer/ott-common/src/stores/ConfigStore';
import { useFavoritesStore } from '@jwplayer/ott-common/src/stores/FavoritesStore';
import FavoritesController from '@jwplayer/ott-common/src/stores/FavoritesController';
import AccountController from '@jwplayer/ott-common/src/stores/AccountController';
import CheckoutController from '@jwplayer/ott-common/src/stores/CheckoutController';
import ProfileController from '@jwplayer/ott-common/src/stores/ProfileController';

import { mockWindowLocation, renderWithRouter } from '../../../test/testUtils';

import User from './User';

const data = {
  loading: false,
  user: {
    id: 'user1',
    email: 'user@jwplayer.com',
    country: 'us',
    firstName: 'User',
    lastName: 'Person',
    regDate: 'Jan 1, 2000',
    lastUserIp: '192.0.0.1',
  },
  subscription: {
    subscriptionId: 90210,
    offerId: 'offer1111',
    expiresAt: 1767994,
    status: 'active',
    nextPaymentPrice: 199.99,
    nextPaymentCurrency: 'USD',
    paymentGateway: '',
    paymentMethod: 'Paypal',
    offerTitle: 'Your Cool Subscription',
    period: 'year',
    totalPrice: 99.95,
  } as Subscription,
  transactions: [
    {
      transactionId: '11232',
      offerId: 'offer1111',
      paymentMethod: 'Ideal',
      offerTitle: 'Your Cool Subscription',
      transactionPriceInclTax: 12.88,
      transactionCurrency: 'EUR',
      customerCountry: 'nl',
      transactionDate: '1657994000',
    } as unknown as Transaction,
    {
      transactionId: '11234',
      offerId: 'offer13',
      paymentMethod: 'Cash',
      offerTitle: 'Your Cool Subscription',
      transactionPriceInclTax: 12.88,
      transactionCurrency: 'EUR',
      customerCountry: 'uk',
      transactionDate: '1667990000',
    } as unknown as Transaction,
  ],
  activePayment: {
    id: 887765,
    paymentMethodSpecificParams: {
      lastCardFourDigits: '9888',
      cardExpirationDate: '03/30',
    },
  } as unknown as PaymentDetail,
};

vi.mock('@jwplayer/ott-common/src/modules/container', () => ({
  getModule: (type: typeof FavoritesController | typeof AccountController | typeof CheckoutController | typeof ProfileController) => {
    switch (type) {
      case FavoritesController:
        return { clear: vi.fn() };
      case AccountController:
        return { logout: vi.fn(), getFeatures: vi.fn(() => ({ canUpdateEmail: false, canRenewSubscription: false })) };
      case CheckoutController:
        return { getSubscriptionSwitches: vi.fn() };
      case ProfileController:
        return { listProfiles: vi.fn() };
    }
  },
}));

describe('User Component tests', () => {
  test('Account Page', () => {
    act(() => {
      useAccountStore.setState(data);
      mockWindowLocation('my-account');
    });
    const { container } = renderWithRouter(<User />);

    expect(container).toMatchSnapshot();
  });

  test('Payments Page', () => {
    act(() => {
      useAccountStore.setState(data);
      mockWindowLocation('payments');
    });
    const { container } = renderWithRouter(<User />);

    expect(container).toMatchSnapshot();
  });

  test('Favorites Page', () => {
    act(() => {
      useAccountStore.setState(data);
      useConfigStore.setState({
        config: {
          features: {
            favoritesList: 'abcdefgh',
          },
          styling: {},
        } as unknown as Config,
      });
      useFavoritesStore.setState({
        getPlaylist: (): Playlist => {
          return {
            title: 'These are my favorite things',
            playlist: [
              {
                mediaid: 'aaabbbcc',
                title: 'Fav 1',
                duration: 12,
                feedid: 'abcdffff',
              } as unknown as PlaylistItem,
              {
                mediaid: 'aaabbbcd',
                title: 'Big Buck Bunny',
                duration: 6000,
                feedid: 'bbbdddff',
              } as unknown as PlaylistItem,
              {
                mediaid: 'ggaaccvv',
                title: 'My last favorite',
                duration: 659,
                feedid: 'bbbbbbbb',
              } as unknown as PlaylistItem,
            ],
          };
        },
      });
      mockWindowLocation('favorites');
    });

    const { container } = renderWithRouter(<User />);

    expect(container).toMatchSnapshot();
  });
});