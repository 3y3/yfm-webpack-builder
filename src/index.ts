import type { Configuration } from 'webpack';
import webpack from 'webpack';
import config from '../webpack.config';

webpack(config as Configuration, (error, result) => {
    console.error(error);
    console.log(result);
});