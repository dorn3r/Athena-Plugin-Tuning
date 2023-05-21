import { Vector3 } from 'alt-shared';


export interface iTuningshopSync {
    engine: number,
    brakes: number,
    transmission: number,
    suspension: number,
    armour: number,
    turbo: number,
    xenon: number,
    spoiler: number,
    maxspoiler: number,
    fbumper: number,
    maxfbumper: number
}

export interface ITuningShop {
    x: number,
    y: number,
    z: number,
    uid: string;
    cost: number;
    vertices: Array<Vector3>;
}
