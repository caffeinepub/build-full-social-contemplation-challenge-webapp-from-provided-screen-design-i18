import { useInternetIdentity } from './useInternetIdentity';

export function useAuthPrincipal() {
  const { identity } = useInternetIdentity();

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  const principal = isAuthenticated ? identity!.getPrincipal().toString() : null;

  return {
    isAuthenticated,
    principal,
    identity
  };
}
