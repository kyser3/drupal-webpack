// Imports.
import * as Util from './util.js';
import * as path from'path';
import * as fs from "fs";
import * as yaml from "js-yaml";
import { globSync } from "glob";

// Get configuration, or throw exception on error.
// @see config.yml
let config;
try {
  config = yaml.load(fs.readFileSync('./.webpack/config.yml', 'utf8'));
} catch (e) {
  throw "Drupal Webpack configuration could not be loaded.";
}

/**
 * Validate configuration.
 *
 * @TODO Add more validations.
 */
const validateConfig = () => {
  if (!config.extensions.scripts) {
    throw "Missing configuration: [config.extensions.scripts] - Please verify the 'config.yml' file found in the '.webpack' directory.";
  }
  if (!config.extensions.styles) {
    throw "Missing configuration: [config.extensions.styles] - Please verify the 'config.yml' file found in the '.webpack' directory.";
  }
}
validateConfig();

/**
 * Get the path to Drupal's root directory.
 *
 * The root is customized within the config.yml file found in the .webpack folder.
 *
 * @returns {string}
 *   Path to Drupal's root, e.g. /web.
 */
export const getDrupalRoot = () => {
  const dirPath = path.resolve(path.join(path.resolve(), config.root));
  if (fs.lstatSync(dirPath).isDirectory()) {
    return dirPath;
  }
  throw "Drupal root not detected at: {" + config.root + "}";
}

/**
 * Get the path to a custom Drupal package.
 *
 * This assumes that the Drupal installation follows best practices and stores custom packages in a nested
 * "custom" folder within the package root folder. e.g. /web/modules/custom & /web/themes/custom.
 *
 * @param type
 *   Drupal package type. e.g. "module" or "theme".
 * @param id
 *   Drupal package machine name.
 *
 * @returns {string}
 *   Absolute path to the Drupal package.
 */
export const getDrupalCustomPackagePath = (type, id) => {
  return path.relative(path.resolve(), path.join(getDrupalRoot(), `${type}s`, 'custom', id));
}

/**
 * Build the webpack entry object using assets from across the Drupal installation.
 *
 * @param env
 *   Environment variables set through the command line or obtain from .env.
 */
export const getDrupalEntries = (env) => {
  let entries = {};

  // If 'module' is set in the environment, we attempt to build entries for the specified module.
  if ('module' in env) {
    return Util.objectMerge(entries, getPackageEntries(env.module, 'module'));
  }

  // If 'theme' is set, we want to get entries for a custom theme.
  if ('theme' in env) {
    return Util.objectMerge(entries, getPackageEntries(env.theme, 'theme'));
  }

  // If 'modules' is set, we want to get entries for all custom modules.
  if ('modules' in env || 'all' in env) {
    let customModulesPath = path.relative(path.resolve(), path.join(getDrupalRoot(), 'modules', 'custom'));
    let customModuleDirectories = Util.getDirectories(customModulesPath);
    customModuleDirectories.forEach(dirname => {
      entries = Util.objectMerge(entries, getPackageEntries(dirname, 'module'));
    });
    return entries;
  }

  // If 'themes' is set, we want to get entries for all custom themes.
  if ('themes' in env || 'all' in env) {
    let customThemesPath = path.relative(path.resolve(), path.join(getDrupalRoot(), 'themes', 'custom'));
    let customThemeDirectories = Util.getDirectories(customThemesPath);
    customThemeDirectories.forEach(dirname => {
      entries = Util.objectMerge(entries, getPackageEntries(dirname, 'theme'));
    });
    return entries;
  }

  // Now we handle environment variables.
  // If a default drupal theme is set, we can parse entries for it.
  entries = Util.objectMerge(entries, getPackageEntries(config.defaultTheme, 'theme'));

  return entries;
}

/**
 * Detect a list of files that need to be processed in a given custom package.
 *
 * Returns an object containing paths to eligible scss and js files, keyed by
 * their relative paths inside the package. The result is designed to work
 * with the "entry" parameter in Webpack configuration.
 *
 * @param id
 *   Package ID.
 * @param type
 *   Package type.
 * @param packagePath
 *   Optionally specify a specific path if the path shouldn't be resolved by default means.
 *
 * @returns {{}}
 *   Eligible "entry" items for Webpack configuration.
 */
export const getPackageEntries = (id, type, packagePath = undefined) => {
  // Get the package path if it wasn't set.
  if (packagePath === undefined) {
    packagePath = getDrupalCustomPackagePath(type, id);
  }

  // If the package does not exist, we can put a warning in the console.
  if (!Util.pathExists(packagePath)) {
    console.warn(`The ${id} ${type} does not exist in your codebase. No assets will be compiled for this ${type}.`);
    // @TODO Add a "Did you mean?" Don't know what this entails but it's not a priority...
  }

  switch(type) {
    case 'module':
      return getCustomModuleEntries(packagePath);
    case 'theme':
      return getCustomThemeEntries(packagePath);
  }
}

/**
 * Detect a list of files that need to be processed in a given custom module.
 *
 * Returns an object containing paths to eligible scss & js files, keyed by
 * their relative paths inside the module. The result is designed to work
 * with the "entry" parameter in Webpack configuration.
 *
 * @param modulePath
 *   Path to a custom module.
 * @returns {{}}
 *   Eligible "entry" items for Webpack configuration.
 */
export const getCustomModuleEntries = (modulePath) => {
  let entries = {};

  // Build .js entries.
  entries = Util.objectMerge(entries, buildEntries(modulePath, config.modules.scripts.source, config.modules.scripts.destination, config.extensions.scripts));

  // Build .scss entries.
  entries = Util.objectMerge(entries, buildEntries(modulePath, config.modules.styles.source, config.modules.styles.destination, config.extensions.styles));

  // Check if there are submodules.
  // We will do the same process for all submodules.
  let submodulesDirectory = path.join(modulePath, 'modules');
  if (Util.pathExists(submodulesDirectory)) {
    let submoduleDirectories = Util.getDirectories(submodulesDirectory);
    submoduleDirectories.forEach(dirname => {
      let dirPath = path.join(submodulesDirectory, dirname);
      let moduleEntries = getPackageEntries(dirname, 'module', dirPath);
      entries = Util.objectMerge(entries, moduleEntries);
    });
  }

  // Return our entries.
  return entries;
}

/**
 * Detect a list of files that need to be processed in a given custom theme.
 *
 * Returns an object containing paths to eligible scss and js files, keyed by
 * their relative paths inside the module. The result is designed to work
 * with the "entry" parameter in Webpack configuration.
 *
 * @param themePath
 *   Path to a custom theme.
 * @returns {{}}
 *   Eligible "entry" items for Webpack configuration.
 */
export const getCustomThemeEntries = (themePath) => {
  let entries = {};

  // Build .js entries.
  entries = Util.objectMerge(entries, buildEntries(themePath, config.themes.scripts.source, config.themes.scripts.destination, config.extensions.scripts));

  // Build .scss entries.
  entries = Util.objectMerge(entries, buildEntries(themePath, config.themes.styles.source, config.themes.styles.destination, config.extensions.styles));

  // Build js & .scss entries for components folder.
  // This is for SDC.
  entries = Util.objectMerge(entries, buildEntries(themePath, config.themes.components, config.themes.components, config.extensions.scripts));
  entries = Util.objectMerge(entries, buildEntries(themePath, config.themes.components, config.themes.components, config.extensions.styles));

  // Return our entries.
  return entries;
}

/**
 * Build webpack entries given a folder in a package.
 *
 * @param packagePath
 *   Source directory to build from.
 * @param source
 *   Source directory to build from.
 * @param destination
 *   Destination directory to build to.
 * @param extension
 *   File extension to look for.
 *
 * @returns {{}}
 *   Entries.
 */
export function buildEntries(
  packagePath,
  source,
  destination,
  extension,
){
  // Instantiate entries.
  let entries = {};

  // Build entries.
  let files = globSync(`${packagePath}/${source}/**/*${extension}`);
  files.forEach(filePath => {
    // Get the file name.
    let fileName = path.basename(filePath);

    // Ignore any .min.js files.
    if (fileName.endsWith('.min.js')) {
      return;
    }

    // File names that start with '_' are meant to be includes, and are therefore ignored.
    // This can be turned off in options.
    if (fileName.startsWith('_') && config.skipUnderscoreFiles) {
      return;
    }

    // Build our resulting path and entry.
    let chunk = path.join(packagePath, destination, path.relative(path.join(packagePath, source), filePath).replace(extension, ''));
    if (!entries[chunk]) {
      entries[chunk] = [];
    }
    entries[chunk].push("./" + filePath);
  });

  return entries;
}
