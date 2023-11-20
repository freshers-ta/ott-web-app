import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { getModule } from '@jwplayer/ott-common/src/modules/container';
import AccountController from '@jwplayer/ott-common/src/stores/AccountController';
import { useConfigStore } from '@jwplayer/ott-common/src/stores/ConfigStore';
import { addQueryParam } from '@jwplayer/ott-common/src/utils/location';

type intervalCheckAccessPayload = {
  interval?: number;
  iterations?: number;
  offerId?: string;
};

const useCheckAccess = () => {
  const accountController = getModule(AccountController);

  const intervalRef = useRef<number>();
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { t } = useTranslation('user');

  const { offers } = useConfigStore();

  const intervalCheckAccess = useCallback(
    ({ interval = 3000, iterations = 5, offerId }: intervalCheckAccessPayload) => {
      if (!offerId && offers?.[0]) {
        offerId = offers[0];
      }

      intervalRef.current = window.setInterval(async () => {
        const hasAccess = await accountController.checkEntitlements(offerId);

        if (hasAccess) {
          await accountController.reloadActiveSubscription();
          navigate(addQueryParam(location, 'u', 'welcome'));
        } else if (--iterations === 0) {
          window.clearInterval(intervalRef.current);
          setErrorMessage(t('payment.longer_than_usual'));
        }
      }, interval);
    },
    [offers, navigate, location, t, accountController],
  );

  useEffect(() => {
    return () => {
      window.clearInterval(intervalRef.current);
    };
  }, []);

  return { intervalCheckAccess, errorMessage };
};

export default useCheckAccess;