import '@testing-library/jest-native/extend-expect';

// Mock axios
jest.mock('axios');

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    connected: false,
  })),
}));

// Mock React Native modules
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
