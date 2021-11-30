import { Inspector } from '../inspectors/index.js';

export type Shipper = Omit<Inspector, 'type'> & {
  type: 'shipper';
};

export type ShipperDefinition = Omit<Shipper, 'type'>;

export enum ShipperName {
  Console = 'console-shipper',
}

function addProperties(definition: ShipperDefinition): Shipper {
  return {
    ...definition,
    type: 'shipper',
  };
}

export function createShipper(fnOrShipper: ShipperDefinition | (() => ShipperDefinition)) {
  if (typeof fnOrShipper === 'function') {
    return addProperties(fnOrShipper());
  }
  return addProperties(fnOrShipper);
}
