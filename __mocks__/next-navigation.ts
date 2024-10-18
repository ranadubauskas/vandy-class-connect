import { jest } from '@jest/globals';

export const useRouter = jest.fn().mockReturnValue({
    push: jest.fn(),
    prefetch: jest.fn(),
    replace: jest.fn(),
    query: {}, 
    asPath: '', 
    route: '/', 
    pathname: '',
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
    beforePopState: jest.fn(),
    isFallback: false,
    isLocaleDomain: false,
    isReady: true,
    isPreview: false,
  });
  
  export const usePathname = jest.fn(() => '/mocked-path');