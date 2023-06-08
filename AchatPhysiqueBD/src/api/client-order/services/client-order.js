'use strict';

/**
 * client-order service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::client-order.client-order');
