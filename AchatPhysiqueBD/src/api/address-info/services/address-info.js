'use strict';

/**
 * address-info service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::address-info.address-info');
