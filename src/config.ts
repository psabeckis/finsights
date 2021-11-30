export enum Mode {
  Continuous = 'CONTINUOUS',
  Loose = 'LOOSE',
}

export type Config = {
  // Does not ensure the execution of functions - (Default: 'Continuous')
  mode: Mode;
  // Prevents arrow functions of being used for inspection to enforce automatic name resolution - (Default: false)
  noArrowFunctions: boolean;
  // Tries to determine and track result size, incurs performance costs at large datasets - (Default: false)
  calculateResultSize: boolean;
};

function createConfig() {
  const config: Config = {
    mode: Mode.Continuous,
    noArrowFunctions: false,
    calculateResultSize: false,
  };

  return {
    getDerived: (updates: Partial<Config>) => ({ ...config, ...updates }),
    get: () => ({ ...config }),
    set: (newConfig: Partial<Config>) => {
      Object.assign(config, newConfig);
    },
  };
}

export const config = createConfig();
