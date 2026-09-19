import { lazy } from 'react';
import { createBrowserRouter, Navigate, useLocation } from 'react-router';

import { AppLayout } from '@/layouts/AppLayout';
import { HOME_PATH } from '@/site';

import { GuestOnly, RequireAuth, RootRoute } from './guards';

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));
const HomePage = lazy(() => import('@/pages/HomePage'));
const ExplorePage = lazy(() => import('@/pages/ExplorePage'));
const SearchPage = lazy(() => import('@/pages/SearchPage'));
const TagPage = lazy(() => import('@/pages/TagPage'));
const PostPage = lazy(() => import('@/pages/PostPage'));
const EditorPage = lazy(() => import('@/pages/EditorPage'));
const DraftsPage = lazy(() => import('@/pages/DraftsPage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const BookmarksPage = lazy(() => import('@/pages/BookmarksPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const FollowListPage = lazy(() => import('@/pages/FollowListPage'));
const EditProfilePage = lazy(() => import('@/pages/EditProfilePage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

/** Pages marked wide use the right-hand column too (no sidebar). */
export interface RouteHandle {
  wide?: boolean;
}

const wide: RouteHandle = { wide: true };

function RootRedirect() {
  const { search, hash } = useLocation();
  return <Navigate to={`${HOME_PATH}${search}${hash}`} replace />;
}

export const router = createBrowserRouter([
  {
    element: <RootRoute />,
    children: [
      {
        path: '/login',
        element: (
          <GuestOnly>
            <LoginPage />
          </GuestOnly>
        ),
      },
      {
        path: '/register',
        element: (
          <GuestOnly>
            <RegisterPage />
          </GuestOnly>
        ),
      },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
      {
        element: <AppLayout />,
        children: [
          // arabdev.site/ opens the dashboard; old links such as /?tab=following keep their query.
          { index: true, element: <RootRedirect /> },
          {
            path: HOME_PATH.slice(1),
            element: (
              <RequireAuth>
                <HomePage />
              </RequireAuth>
            ),
          },
          { path: 'explore', element: <ExplorePage /> },
          { path: 'search', element: <SearchPage /> },
          { path: 'tags/:slug', element: <TagPage /> },
          { path: 'posts/:postId', element: <PostPage /> },
          {
            path: 'posts/:postId/edit',
            element: (
              <RequireAuth>
                <EditorPage />
              </RequireAuth>
            ),
            handle: wide,
          },
          {
            path: 'create',
            element: (
              <RequireAuth>
                <EditorPage />
              </RequireAuth>
            ),
            handle: wide,
          },
          {
            path: 'drafts',
            element: (
              <RequireAuth>
                <DraftsPage />
              </RequireAuth>
            ),
          },
          {
            path: 'drafts/:draftId',
            element: (
              <RequireAuth>
                <EditorPage />
              </RequireAuth>
            ),
            handle: wide,
          },
          {
            path: 'notifications',
            element: (
              <RequireAuth>
                <NotificationsPage />
              </RequireAuth>
            ),
          },
          {
            path: 'bookmarks',
            element: (
              <RequireAuth>
                <BookmarksPage />
              </RequireAuth>
            ),
          },
          {
            path: 'profile/edit',
            element: (
              <RequireAuth>
                <EditProfilePage />
              </RequireAuth>
            ),
            handle: wide,
          },
          { path: 'settings', element: <Navigate to="/settings/account" replace /> },
          {
            path: 'settings/:section',
            element: (
              <RequireAuth>
                <SettingsPage />
              </RequireAuth>
            ),
            handle: wide,
          },
          { path: 'u/:username', element: <ProfilePage /> },
          { path: 'u/:username/:list', element: <FollowListPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
