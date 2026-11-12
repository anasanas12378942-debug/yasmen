const db = require("../db");
const { getPlatformSettings } = require("./platformSettings");

function getPublicPlatformInfo() {
  const settings = getPlatformSettings();

  return {
    name: settings.name,
    description: settings.description,
    primaryColor: settings.primary_color,
    secondaryColor: settings.secondary_color,
    logo: settings.logo
  };
}

module.exports = { getPublicPlatformInfo };
