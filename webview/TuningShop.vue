<template>
    <div class="tuning-shop-wrapper pl-2">
        <div class="stack">
            <!--<div class="split split-full space-between mt-2">
                <Button class="mr-2 fill-full-width" :color="pageIndex === 0 ? 'orange' : 'blue'" @click="setPage(0)">
                    {{ locale.STANCE }}
                </Button>
                <Button class="mr-2 fill-full-width" :color="pageIndex === 1 ? 'orange' : 'blue'" @click="setPage(1)">
                    {{ locale.OPTIONS }}
                </Button>
            </div>-->
            <div class="page-filler">
                <component
                    :is="pages[pageIndex]"
                    class="fade-in"
                    :key="pageIndex"
                    v-bind:locale="locale"
                    v-bind:data="data"
                    @set-engine="engine"
                    @set-brakes="brakes"
                    @set-transmission="transmission"
                    @set-suspension="suspension"
                    @set-armour="armour"
                    @set-turbo="turbo"
                    @set-xenon="xenon"
                    @set-spoiler="spoiler"
                    @set-fbumper="fbumper"
                    @update-engine="updateEngine"
                    @update-brakes="updateBrakes"
                    @update-transmission="updateTransmission"
                    @update-suspension="updateSuspension"
                    @update-armour="updateArmour"
                    @update-turbo="updateTurbo"
                    @update-xenon="updateXenon"
                    @update-spoiler="updateSpoiler"
                    @update-fbumper="updatefbumper"
                ></component>
            </div>
            <div class="split">
                <Button color="red" class="mt-4 mr-2 fill-full-width" @click="exit">
                    {{ locale.EXIT }}
                </Button>
                <Button color="yellow" class="mt-4 mr-2 fill-full-width" @click="nextCam">
                    {{ locale.CAMERA }}
                </Button>
                <Button color="green" class="mt-4 mr-2 fill-full-width" @click="purchase">
                    {{ locale.BUY }}
                </Button>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent } from 'vue';
import { iTuningshopSync } from '../shared/interfaces';
import { TUNINGSHOP_LOCALE } from '../shared/locales';

const ComponentName = 'TuningShop';
export default defineComponent({
    name: ComponentName,
    components: {
        // Global Components
        Button: defineAsyncComponent(() => import('@components/Button.vue')),
        Frame: defineAsyncComponent(() => import('@components/Frame.vue')),
        Icon: defineAsyncComponent(() => import('@components/Icon.vue')),
        Input: defineAsyncComponent(() => import('@components/Input.vue')),
        Modal: defineAsyncComponent(() => import('@components/Modal.vue')),
        Module: defineAsyncComponent(() => import('@components/Module.vue')),
        RangeInput: defineAsyncComponent(() => import('@components/RangeInput.vue')),
        RangeInputSlider: defineAsyncComponent(() => import('@components/RangeInputSlider.vue')),
        SimpleInput: defineAsyncComponent(() => import('@components/SimpleInput.vue')),
        Toolbar: defineAsyncComponent(() => import('@components/Toolbar.vue')),
        // Local Components
        TuningStance: defineAsyncComponent(() => import('./components/TuningStance.vue')),
        TuningOptions: defineAsyncComponent(() => import('./components/TuningOptions.vue')),
    },
    data() {
        return {
            engine: 0,
            brakes: 0,
            transmission: 0,
            suspension: 0,
            armour: 0,
            turbo: 0,
            xenon: 0,
            spoiler: 0,
            fbumper: 0,
            pageIndex: 0,
            pages: ['TuningOptions'],
            locale: TUNINGSHOP_LOCALE,
            data: {
                engine: 0,
                brakes: 0,
                transmission: 0,
                suspension: 0,
                armour: 0,
                turbo: 0,
                xenon: 0,
                spoiler: 0,
                fbumper: 0,
            },
        };
    },
    mounted() {
        if ('alt' in window) {
            alt.on(`${ComponentName}:Ready`, this.syncData);
            alt.emit(`${ComponentName}:Ready`);
        }
    },
    unmounted() {
        if ('alt' in window) {
            alt.off(`${ComponentName}:Ready`, this.syncData);
        }
    },
    methods: {
        syncData(syncData: iTuningshopSync) {
            this.data = syncData;
        },

        setPage(index: number) {
            this.pageIndex = index;
        },

        updateEngine(engine: number) {
            this.engine = engine;

            this.update();
        },

        updateBrakes(brakes: number) {
            this.brakes = brakes;

            this.update();
        },

        updateTransmission(transmission: number) {
            this.transmission = transmission;

            this.update();
        },

        updateSuspension(suspension: number) {
            this.suspension = suspension;

            this.update();
        },

        updateArmour(armour: number) {
            this.armour = armour;

            this.update();
        },

        updateTurbo(turbo: number) {
            this.turbo = turbo;

            this.update();
        },

        updateXenon(xenon: number) {
            this.xenon = xenon;

            this.update();
        },

        updateSpoiler(spoiler: number) {
            this.spoiler = spoiler;

            this.update();
        },

        updatefbumper(fbumper: number) {
            this.fbumper = fbumper;

            this.update();
        },

        update() {
            if ('alt' in window) {
                alt.emit(
                    `${ComponentName}:Update`,
                    this.engine,
                    this.brakes,
                    this.transmission,
                    this.suspension,
                    this.armour,
                    this.turbo,
                    this.xenon,
                    this.spoiler,
                    this.fbumper,
                );
            }
        },
        nextCam() {
            if ('alt' in window) {
                alt.emit(`${ComponentName}:NextCam`);
            }
        },
        purchase() {
            if ('alt' in window) {
                alt.emit(
                    `${ComponentName}:Purchase`,
                    this.engine,
                    this.brakes,
                    this.transmission,
                    this.suspension,
                    this.armour,
                    this.turbo,
                    this.xenon,
                    this.spoiler,
                    this.fbumper,
                );
            }
        },
        exit() {
            if ('alt' in window) {
                alt.emit(`${ComponentName}:Close`);
            }
        },
    },
});
</script>

<style scoped>
.tuning-shop-wrapper {
    position: fixed;
    left: 0vh !important;
    top: 0vh;
    background: rgba(12, 12, 12, 1) !important;
    min-height: 100vh;
    max-height: 100vh;
    min-width: 250px;
    max-width: 250px;
    overflow: hidden;
}

.page-filler {
    overflow: hidden;
    min-height: calc(100vh - 114px);
    max-height: calc(100vh - 114px);
}
</style>
