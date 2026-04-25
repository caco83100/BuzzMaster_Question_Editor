import type { IBuzzerPlugin } from 'src/plugins/buzzer/types';
import { MockDevice } from 'src/plugins/buzzer/mock/MockDevice';

function readMockFlagFromLocation(): string | null {
  const search = new URLSearchParams(window.location.search);
  const directValue = search.get('mockBuzzers');
  if (directValue !== null) {
    return directValue;
  }

  const hash = window.location.hash;
  const queryIndex = hash.indexOf('?');
  if (queryIndex < 0) {
    return null;
  }

  const hashSearch = new URLSearchParams(hash.slice(queryIndex + 1));
  return hashSearch.get('mockBuzzers');
}

function isMockEnabled(): boolean {
  // TODO remove later: temporary mock mode to test without physical buzzers.
  if (!process.env.DEV) {
    return false;
  }

  const flag = readMockFlagFromLocation();
  if (flag === '0' || flag === 'false') {
    return false;
  }

  return true;
}

export const initMockDeviceManager: IBuzzerPlugin = async (api) => {
  if (!isMockEnabled()) {
    return;
  }

  await api.addDevice(new MockDevice());
};
