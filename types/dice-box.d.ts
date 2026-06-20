declare module "@3d-dice/dice-box" {
  type DiceBoxConfig = Record<string, unknown>;

  type RollNotation =
    | string
    | {
        qty?: number;
        sides: number | string;
        value?: number;
        themeColor?: string;
        theme?: string;
      };

  export default class DiceBox {
    constructor(config?: DiceBoxConfig);
    init(): Promise<boolean | void>;
    roll(notation: RollNotation | RollNotation[]): Promise<unknown>;
    add(notation: RollNotation | RollNotation[]): Promise<unknown>;
    clear(): DiceBox;
    resizeWorld?(): void;
    updateConfig?(config: DiceBoxConfig): void;
  }
}

declare module "@3d-dice/dice-box/dist/style.css";
