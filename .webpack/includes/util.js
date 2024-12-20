// Requirements.
const fs = require("fs");
const _ = require("lodash");

/**
 * Merge two objects using lodash.
 *
 * @param object1
 *   First object.
 * @param object2
 *   Second object.
 * @returns {{}}
 *   Merged object.
 */
exports.objectMerge = (object1, object2) => {
  return _.mergeWith({}, object1, object2, function(a, b) {
    if (_.isArray(a)) {
      return b.concat(a);
    }
  });
}

/**
 * Utility function to get a list of directories.
 *
 * @param source
 *   Source path to lookup.
 *
 * @returns {string[]}
 *   Array of directories found.
 */
exports.getDirectories = source =>
  fs.readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)

/**
 * Utility function to get a list of files.
 *
 * @param source
 *   Source path to lookup.
 *
 * @returns {string[]}
 *   Array of files found.
 */
exports.getFiles = source =>
  fs.readdirSync(source, { withFileTypes: true })
    .filter(file => !file.isDirectory())
    .map(file => file.name)

/**
 * Check if a file or directory exists in a given path.
 *
 * @param path
 *   The path to check.
 *
 * @returns {boolean}
 *   Returns TRUE if the path exists, or FALSE otherwise.
 */
exports.pathExists = (path) => {
  return fs.existsSync(path);
}
