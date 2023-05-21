import * as alt from 'alt-server';
import * as Athena from '@AthenaServer/api';
import { getMods } from '@AthenaServer/vehicle/tuning';
import { ITuningShop, iTuningshopSync } from '@AthenaPlugins/alpha-tuningmain/shared/interfaces';
import { TUNING_SHOPS } from './shops';
import { Tuningshop_View_Events } from '@AthenaPlugins/alpha-tuningmain/shared/events';
import { sha256Random } from '@AthenaServer/utility/hash';
import { PolygonShape } from '@AthenaServer/extensions/extColshape';
import { TUNINGSHOP_LOCALE } from '@AthenaPlugins/alpha-tuningmain/shared/locales';
import IVehicleTuning from '@AthenaShared/interfaces/vehicleTuning';
import { SYSTEM_EVENTS } from '@AthenaShared/enums/system';

const shops: Array<ITuningShop> = [];
const inShop = {};

class InternalFunctions {
    /**
     * Update the vehicle tuning based on data.
     * @param vehicle - The vehicle to update.
     */
    static async updateTuning(player: alt.Player, vehicle: alt.Vehicle) {

        const veh = await Athena.getters.vehicle.byID(player.vehicle.id);
        const veh2 = await Athena.document.vehicle.get(veh);
        
        if (!veh2.tuning) return;

        for (let i = 0; i < veh2.tuning.mods.length; i++) {
            const vehmods = veh2.tuning.mods[i]; 
            player.vehicle.setMod(vehmods.id, vehmods.value)
        }
        
    }

    static previewTuning(
        player: alt.Player,
        engine: number = 0,
        brakes: number = 0,
        transmission: number = 0,
        suspension: number = 0,
        armour: number = 0,
        turbo: number = 0,
        xenon: number = 0,
        spoiler: number = 0,
        fbumper: number = 0,
    ) {
        if (!inShop[player.id]) {
            return;
        }

        if (!player.vehicle) {
            return;
        }

        if (engine >= 0) {
            player.vehicle.setMod(11, engine)
        }

        if (brakes >= 0) {
            player.vehicle.setMod(12, brakes)
        }

        if (transmission >= 0) {
            player.vehicle.setMod(13, transmission)
        }

        if (suspension >= 0) {
            player.vehicle.setMod(15, suspension)
        }

        if (armour >= 0) {
            player.vehicle.setMod(16, armour)
        }

        if (turbo >= 0) {
            player.vehicle.setMod(18, turbo)
        }

        if (xenon >= 0) {
            player.vehicle.setMod(22, xenon)
        }

        if (spoiler >= 0) {
            player.vehicle.setMod(0, spoiler)
        }

        if (fbumper >= 0) {
            player.vehicle.setMod(1, fbumper)
        }
    }
}

export class TuningShopView {
    static init() {
        for (let i = 0; i < TUNING_SHOPS.length; i++) {
            TuningShopView.register(TUNING_SHOPS[i]);
        }

        alt.onClient(Tuningshop_View_Events.PREVIEW_TUNING, InternalFunctions.previewTuning);
        alt.onClient(Tuningshop_View_Events.OPEN, TuningShopView.open);
        alt.onClient(Tuningshop_View_Events.PURCHASE, TuningShopView.purchase);
        alt.onClient(Tuningshop_View_Events.CLOSE, TuningShopView.close);
        //VehicleEvents.on(ATHENA_EVENTS_VEHICLE.SPAWNED, InternalFunctions.updateTuning);
    }

    /**
     * Update the vehicle's tuning and remove the player from the inShop array.
     * Restores the previous tuning that was applied to the vehicle.
     * @param player - alt.Player - The player who is opening the tuning shop.
     * @returns Nothing.
     */
    static close(player: alt.Player) {
        if (!player.vehicle) {
            return;
        }

        InternalFunctions.updateTuning(player, player.vehicle);
        delete inShop[player.id];
    }

    /**
     * Register a Vehicle Tuning Shop
     * @static
     * @param {ITuningShop} shop
     * @return {*}  {string}
     * @memberof PaintShopView
     */
    static register(shop: ITuningShop): string {
        if (!shop.uid) {
            shop.uid = sha256Random(JSON.stringify(shop));
        }

        const index = shops.findIndex((x) => x.uid === shop.uid);
        if (index >= 0) {
            console.error(new Error(`Shop with ${shop.uid} is a duplicate.`));
            return null;
        }

        Athena.controllers.blip.append({
            uid: `tuning-shop-${shop.uid}`,
            color: 46,
            pos: shop.vertices[0],
            scale: 0.6,
            shortRange: true,
            text: TUNINGSHOP_LOCALE.TUNINGSHOP_LABEL,
            sprite: 100
        })

        const polygon = new PolygonShape(
            shop.vertices[0].z - 2.5,
            shop.vertices[0].z + 2.5,
            shop.vertices,
            true,
            false,
        );

        for (let i = 0; i < TUNING_SHOPS.length; i++) {
            const position = new alt.Vector3(TUNING_SHOPS[i].x, TUNING_SHOPS[i].y, TUNING_SHOPS[i].z);
            const uid = TUNING_SHOPS[i].uid
            Athena.controllers.interaction.append({
                uid: `tuning-shop-${uid}`,
                position: position,
                description: 'Tuning Shop Press shift + E',
                debug: false,
                
            });
        }

        

        polygon.addEnterCallback(TuningShopView.enter);
        polygon.addLeaveCallback(TuningShopView.leave);
        return shop.uid;
    }

    /**
     * When the player enters the polygon, they will be able to open the tuning shop.
     * This function is triggered when a player has entered the PolygonShape.
     * @param {PolygonShape} polygon - PolygonShape
     * @param player - alt.Player
     * @returns Nothing.
     */
    static enter(polygon: PolygonShape, player: alt.Player) {
        if (!(player instanceof alt.Player)) {
            return;
        }

        if (!player.vehicle) {
            Athena.player.emit.notification(player, TUNINGSHOP_LOCALE.MUST_BE_IN_A_VEHICLE);
            return;
        }

        if (Athena.vehicle.tempVehicles.has(player.vehicle)) {
            Athena.player.emit.notification(player, TUNINGSHOP_LOCALE.CANNOT_BE_MODIFIED);
            return;
        }

        if (player.vehicle.driver.id !== player.id) {
            return;
        }

        if (!player.vehicle.modKit) {
            player.vehicle.modKit = 1;
        }

        inShop[player.id] = true;

        Athena.player.emit.sound2D(player, 'shop_enter', 0.5);

        alt.log('player key work');

        alt.emitClient(player, SYSTEM_EVENTS.INTERACTION_TEMPORARY, Tuningshop_View_Events.OPEN);
    }

    /**
     * When a player leaves the shop, the shop will be removed from the player's interaction list.
     * Removes all temporary interactions that were created in the PolygonShape.
     * @param {PolygonShape} polygon - The polygon that the player is leaving.
     * @param player - alt.Player - The player that is leaving the shop.
     * @returns Nothing.
     */
    static leave(polygon: PolygonShape, player: alt.Player) {
        if (!(player instanceof alt.Player)) {
            return;
        }

        inShop[player.id] = false;
        delete inShop[player.id];
        alt.emitClient(player, SYSTEM_EVENTS.INTERACTION_TEXT_REMOVE, polygon.uid);
        alt.emitClient(player, SYSTEM_EVENTS.INTERACTION_TEMPORARY, null);
    }

    /**
     * Opens the tuning shop for the player
     * @param player - alt.Player
     * @returns The `alt.emitClient` function returns a `Promise` object.
     */
    static async open(player: alt.Player) {
        const vehicleData = Athena.document.vehicle.get(player.vehicle);
        if (!player.vehicle || player.vehicle.driver !== player) {
            return;
        }

        if (Athena.vehicle.tempVehicles.has(player.vehicle)) {
            return;
        }

        const playerData = Athena.document.character.get(player);
        if (vehicleData.owner !== playerData._id) {
            return;
        }

        if (!inShop[player.id]) {
            return;
        }

        const info = await Athena.vehicle.tuning.getMods(player.vehicle);
        const maxspoiler = await player.vehicle.getModsCount(0)//spoiler
        const maxfbumper = await player.vehicle.getModsCount(1)//front bumper
        
        for (let i = 0; i < info.length; i++) {
            const rPoint = info[i];
            const syncData: iTuningshopSync = {
                engine: info[11].value,
                brakes: info[12].value,
                transmission: info[13].value,
                suspension: info[15].value,
                armour: info[16].value,
                turbo: info[18].value,
                xenon: info[22].value,
                spoiler: info[0].value,
                maxspoiler: maxspoiler,
                fbumper: info[1].value,
                maxfbumper: maxfbumper,
                }
            alt.emitClient(player, Tuningshop_View_Events.OPEN, syncData);

            };
    }

    /**
     * It takes in a player, the camber, height, rimradius, trackwidth, tyreradius, tyrewidth, engine, brakes, transmission, suspension, 
     * armour, turbo, xenon and updates the vehicle's
     * camber, height, rimradius, trackwidth, tyreradius, tyrewidth, engine, brakes, transmission, suspension, 
     * armour, turbo and xenon
     * @param player - alt.Player - The player who is purchasing the vehicle.
     * @param {number} engine - The engine of the vehicle.
     * @param {number} brakes - The brakes of the vehicle.
     * @param {number} transmission - The transmission of the vehicle.
     * @param {number} suspension - The suspension of the vehicle.
     * @param {number} armour - The armour of the vehicle.
     * @param {number} turbo - The turbo of the vehicle.
     * @param {number} xenon - The xenon of the vehicle.
     * @param {number} spoiler - The spoiler of the vehicle.
     * @param {number} fbumper - The front bumper of the vehicle.
     * @returns Nothing.
     */
    static purchase(
        player: alt.Player,
        engine: number,
        brakes: number,
        transmission: number,
        suspension: number,
        armour: number,
        turbo: number,
        xenon: number,
        spoiler: number,
        fbumper: number,
    ) {
        const veh = Athena.document.vehicle.get(player.vehicle);
        if (!player.vehicle || player.vehicle.driver !== player) {
            return;
        }

        if (!inShop[player.id]) {
            return;
        }

        if (Athena.vehicle.tempVehicles.has(player.vehicle)) {
            return;
        }

        const playerData = Athena.document.character.get(player);
        if (veh.owner !== playerData._id) {
            return;
        }

        if (!player.vehicle.modKit) {
            player.vehicle.modKit = 1;
        }

        if (engine !== undefined && engine !== null) {
            if (engine < 0) {
            } else {
                player.vehicle.setMod(11, engine)
            }
        }

        if (brakes !== undefined && brakes !== null) {
            player.vehicle.setMod(12, brakes);
        }

        if (transmission !== undefined && transmission !== null) {
            player.vehicle.setMod(13, transmission);
        }

        if (suspension !== undefined && suspension !== null) {
            player.vehicle.setMod(15, suspension);
        }

        if (armour !== undefined && armour !== null) {
            player.vehicle.setMod(16, armour);
        }

        if (turbo !== undefined && turbo !== null) {
            player.vehicle.setMod(18, turbo);
        }

        if (xenon !== undefined && xenon !== null) {
            player.vehicle.setMod(22, xenon);
        }

        if (spoiler !== undefined && spoiler !== null) {
            player.vehicle.setMod(0, spoiler);
        }

        if (fbumper !== undefined && fbumper !== null) {
            player.vehicle.setMod(1, fbumper);
        }
        
        const tuningData: IVehicleTuning = Athena.vehicle.tuning.getTuning(player.vehicle);

        Athena.document.vehicle.set(player.vehicle, 'tuning', tuningData);

        InternalFunctions.updateTuning(player, player.vehicle);

    }
}
