import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Outlet } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useProfileStore } from '@jwp/ott-common/src/stores/ProfileStore';
import { useProfiles } from '@jwp/ott-hooks-react/src/useProfiles';
import { useAccountStore } from '@jwp/ott-common/src/stores/AccountStore';
import { shallow } from '@jwp/ott-common/src/utils/compare';
import LoadingOverlay from '@jwp/ott-ui-react/src/components/LoadingOverlay/LoadingOverlay';

import useNotifications from '#src/hooks/useNotifications';

const RoutesContainer = () => {
  const { i18n } = useTranslation();
  const location = useLocation();

  const { profile, selectingProfileAvatar } = useProfileStore();
  useProfiles();

  const userData = useAccountStore((s) => ({ loading: s.loading, user: s.user }), shallow);

  // listen to websocket notifications
  useNotifications();

  // set/update lang html lang attribute
  useEffect(() => {
    document.documentElement.setAttribute('lang', i18n.language);
  }, [i18n.language]);

  // used for social logins
  // @todo should users be redirected away from a page after login?
  if (userData.user && !userData.loading && window.location.href.includes('#token')) {
    return <Navigate to={{ ...location, hash: '' }} replace />; // component instead of hook to prevent extra re-renders
  }

  // show a loading overlay when a profile is loading
  if (userData.user && selectingProfileAvatar !== null) {
    return <LoadingOverlay profileImageUrl={selectingProfileAvatar || profile?.avatar_url} />;
  }

  return <Outlet />;
};

export default RoutesContainer;
