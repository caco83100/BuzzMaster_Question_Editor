import { BuzzerButton, type ButtonState, type IDevice } from 'src/plugins/buzzer/types';

type KeyBinding = {
  key: string;
  controller: number;
  button: BuzzerButton;
};

const KEY_BINDINGS: KeyBinding[] = [
  // AZERTY-friendly mapping
  // Controller 1
  { key: 'a', controller: 0, button: BuzzerButton.RED },
  { key: 'z', controller: 0, button: BuzzerButton.BLUE },
  { key: 'e', controller: 0, button: BuzzerButton.ORANGE },
  { key: 'r', controller: 0, button: BuzzerButton.GREEN },
  { key: 't', controller: 0, button: BuzzerButton.YELLOW },
  // Controller 2
  { key: 'q', controller: 1, button: BuzzerButton.RED },
  { key: 's', controller: 1, button: BuzzerButton.BLUE },
  { key: 'd', controller: 1, button: BuzzerButton.ORANGE },
  { key: 'f', controller: 1, button: BuzzerButton.GREEN },
  { key: 'g', controller: 1, button: BuzzerButton.YELLOW },
  // Controller 3
  { key: 'w', controller: 2, button: BuzzerButton.RED },
  { key: 'x', controller: 2, button: BuzzerButton.BLUE },
  { key: 'c', controller: 2, button: BuzzerButton.ORANGE },
  { key: 'v', controller: 2, button: BuzzerButton.GREEN },
  { key: 'b', controller: 2, button: BuzzerButton.YELLOW },
  // Controller 4
  { key: 'y', controller: 3, button: BuzzerButton.RED },
  { key: 'u', controller: 3, button: BuzzerButton.BLUE },
  { key: 'i', controller: 3, button: BuzzerButton.ORANGE },
  { key: 'o', controller: 3, button: BuzzerButton.GREEN },
  { key: 'p', controller: 3, button: BuzzerButton.YELLOW },
];

export class MockDevice implements IDevice {
  readonly id = `mock-device-${crypto.randomUUID()}`;
  readonly controllers = 4;
  readonly energySavingDelay: undefined;
  buttonUpdateHandler: (states: ButtonState[]) => void = () => undefined;

  private states: ButtonState[] = Array.from(
    { length: this.controllers * 5 },
    (_, index) => ({
      controller: Math.floor(index / 5),
      button: (index % 5) as BuzzerButton,
      pressed: false,
    }),
  );

  private onKeyDown = (event: KeyboardEvent) => {
    if (event.repeat) {
      return;
    }

    const key = event.key.toLowerCase();
    const binding = KEY_BINDINGS.find((item) => item.key === key);
    if (!binding) {
      return;
    }

    event.preventDefault();
    this.updateButton(binding.controller, binding.button, true);
  };

  private onKeyUp = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    const binding = KEY_BINDINGS.find((item) => item.key === key);
    if (!binding) {
      return;
    }

    event.preventDefault();
    this.updateButton(binding.controller, binding.button, false);
  };

  prepare(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  updateLight(controller: number, value: boolean): void {
    void controller;
    void value;
    // No-op for mock device
  }

  reset(): void {
    this.states = this.states.map((state) => ({
      ...state,
      pressed: false,
    }));
    this.buttonUpdateHandler(this.states);
  }

  close(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  private updateButton(
    controller: number,
    button: BuzzerButton,
    pressed: boolean,
  ): void {
    const index = this.states.findIndex(
      (state) => state.controller === controller && state.button === button,
    );
    if (index < 0) {
      return;
    }

    const current = this.states[index];
    if (!current || current.pressed === pressed) {
      return;
    }

    this.states[index] = {
      ...current,
      pressed,
    };

    this.buttonUpdateHandler(this.states);
  }
}
