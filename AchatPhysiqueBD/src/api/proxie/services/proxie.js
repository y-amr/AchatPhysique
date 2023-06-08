'use strict';

/**
 * proxie service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::proxie.proxie');
