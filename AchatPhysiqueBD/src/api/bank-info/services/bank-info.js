'use strict';

/**
 * bank-info service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::bank-info.bank-info');
