import * as alt from 'alt-client';
import * as native from 'natives';
import * as AthenaClient from '@AthenaClient/api';

import ViewModel from '@AthenaClient/models/viewModel';
import { CinematicCam } from '@AthenaPlugins/paintshop/client/utility/cinematic';
import { isAnyMenuOpen } from '@AthenaClient/webview';
import { Vector3 } from 'alt-shared';
import { Tuningshop_View_Events } from '../../shared/events';
import { iTuningshopSync } from '../../shared/interfaces';

let syncData: iTuningshopSync;

// You should change this to match your Vue Template's ComponentName.
const PAGE_NAME = 'TuningShop';

class InternalFunctions implements ViewModel {
    static async open(_syncData: iTuningshopSync) {
        // Check if any other menu is open before opening this.
        if (isAnyMenuOpen()) {
            return;
        }

        // Data to sync in the interface
        syncData = _syncData;

        // Must always be called first if you want to hide HUD.
        await AthenaClient.webview.setOverlaysVisible(false);

        // This is where we bind our received events from the WebView to
        // the functions in our WebView.
        const view = await AthenaClient.webview.get();
        view.on(`${PAGE_NAME}:Ready`, InternalFunctions.ready);
        view.on(`${PAGE_NAME}:Close`, InternalFunctions.close);
        view.on(`${PAGE_NAME}:Update`, InternalFunctions.update);
        view.on(`${PAGE_NAME}:Purchase`, InternalFunctions.purchase);
        view.on(`${PAGE_NAME}:NextCam`, () => {
            CinematicCam.next(false);
        });

        // This is where we open the page and show the cursor.
        AthenaClient.webview.openPages([PAGE_NAME]);
        AthenaClient.webview.focus();
        AthenaClient.webview.showCursor(true);

        // Turn off game controls, hide the hud.
        alt.toggleGameControls(false);

        // Let the rest of the script know this menu is open.
        alt.Player.local.isMenuOpen = true;

        const points = InternalFunctions.generateCameraPoints();

        // Clear Cinematic Camera
        CinematicCam.destroy();

        // Add Camera Ponts to Cinematic Cam List
        for (let i = 0; i < points.length; i++) {
            CinematicCam.addNode({
                pos: points[i],
                fov: 90,
                easeTime: 250,
                positionToTrack: alt.Player.local.vehicle.pos,
            });
        }

        CinematicCam.next(false);
    }

    static async close() {
        alt.toggleGameControls(true);
        AthenaClient.webview.setOverlaysVisible(true);

        // Turn off bound events.
        // If we do not turn them off we get duplicate event behavior.
        // Also will cause a memory leak if you do not turn them off.
        const view = await AthenaClient.webview.get();
        view.off(`${PAGE_NAME}:Ready`, InternalFunctions.ready);
        view.off(`${PAGE_NAME}:Close`, InternalFunctions.close);
        view.off(`${PAGE_NAME}:Update`, InternalFunctions.update);
        view.off(`${PAGE_NAME}:Purchase`, InternalFunctions.purchase);

        // Close the page.
        AthenaClient.webview.closePages([PAGE_NAME]);

        // Turn on game controls, show the hud.
        AthenaClient.webview.unfocus();
        AthenaClient.webview.showCursor(false);

        // Let the rest of the script know this menu is closed.
        alt.Player.local.isMenuOpen = false;

        alt.emitServer(Tuningshop_View_Events.CLOSE);

        CinematicCam.destroy();
    }

    /**
     * You should call this from the WebView.
     * What this will let you do is define local data in the client.
     *
     * Then when the WebView is ready to receieve that data we can send it.
     * The flow is:
     *
     * Send From WebView -> Get the Data Here -> Send to the WebView
     *
     * @static
     * @memberof TemplateView
     */
    static async ready() {
        const view = await AthenaClient.webview.get();
        view.emit(`${PAGE_NAME}:Ready`, syncData);
    }

    static async purchase(
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
        InternalFunctions.update(engine, brakes, transmission, suspension, armour, turbo, xenon, spoiler, fbumper);
        alt.emitServer(Tuningshop_View_Events.PURCHASE, engine, brakes, transmission, suspension, armour, turbo, xenon, spoiler, fbumper);
        InternalFunctions.close();
    }

    static async update(
        engine: number,
        brakes: number,
        transmission: number,
        suspension: number,
        armour: number,
        turbo: number,
        xenon: number,
        spoiler: number,
        fbumper: number
    ) {
        if (!alt.Player.local.vehicle) {
            return;
        }
        alt.emitServer(Tuningshop_View_Events.PREVIEW_TUNING, engine, brakes, transmission, suspension, armour, turbo, xenon, spoiler, fbumper);
    }

    static generateCameraPoints(): Array<Vector3> {
        const cameraPoints = [];
        const zPos = alt.Player.local.pos.z;

        const [_, min, max] = native.getModelDimensions(alt.Player.local.vehicle.model);
        const offsetCalculations = [];
        const additional = 0.5;

        // Top Left
        offsetCalculations.push({
            x: min.x - additional,
            y: max.y + additional,
            z: zPos,
        });

        // Top Middle
        offsetCalculations.push({
            x: 0,
            y: max.y + additional,
            z: zPos,
        });

        // Top Right
        offsetCalculations.push({
            x: max.x + additional,
            y: max.y + additional,
            z: zPos,
        });

        // Middle Right
        offsetCalculations.push({
            x: max.x + additional,
            y: 0,
            z: zPos,
        });

        // Back Right
        offsetCalculations.push({
            x: max.x + additional,
            y: min.y - additional,
            z: zPos,
        });

        // Middle Center
        offsetCalculations.push({
            x: 0,
            y: min.y - additional,
            z: zPos,
        });

        // Bottom Left
        offsetCalculations.push({
            x: min.x - additional,
            y: min.y - additional,
            z: zPos,
        });

        // Middle Left
        offsetCalculations.push({
            x: min.x - additional,
            y: 0,
            z: zPos,
        });

        for (let i = 0; i < offsetCalculations.length; i++) {
            const calc = native.getOffsetFromEntityInWorldCoords(
                alt.Player.local.vehicle.scriptID,
                offsetCalculations[i].x,
                offsetCalculations[i].y,
                1,
            );

            cameraPoints.push(calc);
        }

        return cameraPoints;
    }
}

alt.onServer(Tuningshop_View_Events.OPEN, InternalFunctions.open);
