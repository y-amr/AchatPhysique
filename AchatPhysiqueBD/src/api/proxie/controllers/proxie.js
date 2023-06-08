'use strict';

/**
 * proxie controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::proxie.proxie');
