import { createContext, useContext } from 'react';

interface NavigationContextType {
  activeSection: string;
  navigateTo: (section: string) => void;
}

export const NavigationContext = createContext<NavigationContextType>({
  activeSection: 'command',
  navigateTo: () => {},
});

export const useNavigation = () => useContext(NavigationContext);
