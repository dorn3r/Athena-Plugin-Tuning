import * as alt from 'alt-server';
import * as Athena from '@AthenaServer/api';
import { TuningShopView } from './src/view';

const PLUGIN_NAME = 'Core Tuning';

Athena.systems.plugins.registerPlugin(PLUGIN_NAME, () => {
    TuningShopView.init();
    alt.log('Core Tuning Loaded!');
});

