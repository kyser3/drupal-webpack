#!/usr/bin/env node
const fs = require('fs');
const colors = require('colors');
const ncp = require('ncp');
const path = require('path');
const prompts = require('prompts');
const rimraf = require('rimraf');

// Root of the drupal-webpack package.
const root = path.resolve(__dirname, '../');

// If the root is equal to our current working directory, we are in development mode.
const development = (root === process.cwd());

// Configure colors.
colors.setTheme({
    silly: 'rainbow',
    input: 'grey',
    verbose: 'cyan',
    prompt: 'blue',
    success: 'green',
    cyan: 'cyan',
    info: 'cyan',
    data: 'blue',
    help: 'cyan',
    status: 'blue',
    warning: 'yellow',
    debug: 'blue',
    error: 'red',
});

// Parse arguments.
let argv = require('minimist')(process.argv.slice(2));

// Process arguments and commands.
void processArguments();

/**
 * Process the command line arguments.
 */
async function processArguments() {
    // The first argument should always be the command.
    let command = argv['_'][0];

    // For now, we're setting the command as install by default. We'll change this once we add more later.
    command = 'install';

    // If the first argument is not set, we'll prompt the user for additional information.
    if (!command) {
        const promptResponse = await prompts(
            {
                message: "Which command would you like to execute?",
                type: "select",
                name: "command",
                choices: [
                    {title: 'Install', value: 'install'},
                    {title: 'Update', value: 'update'},
                ],
                onState: gracefulAbort,
            });
        command = promptResponse['command'];
    }

    // Depending on what was entered as the first argument, we process a different set of commands.
    switch (command) {
        case 'install':
            await install().catch((error) => console.error(error));
            process.exit(1);
            break;

        case 'update':
            await update().catch((error) => console.error(error));
            process.exit(1);
            break;

        default:
            console.error("That command doesn't seem to exist. Feel free to omit arguments to get a list of available commands!".error);
            process.exit(1);
            break;
    }
}

/**
 * This command will copy the '.webpack' folder and 'webpack.config.js' into the root of the project.
 */
async function install() {
    const destinationDir = development ? `${process.cwd()}/development/cli` : process.cwd();

    // If the .webpack directory already exists, it will be replaced.
    if (await directoryExists(`${destinationDir}/.webpack`)) {
        if (await confirm("CAUTION: The directory '.webpack' already exist in your codebase and will be replaced. Proceed?".warning) === false) {
            console.log("Canceled.".info)
            return;
        }
        rimraf.sync(`${destinationDir}/.webpack/includes`);
        rimraf.sync(`${destinationDir}/.webpack/config.example.yml`);
    }

    // Also check the existence of the 'webpack.config.js' file.
    if (await fileExists(`${destinationDir}/webpack.config.js`)) {
        if (await confirm("CAUTION: The file 'webpack.config.js' already exist in your codebase and will be replaced. Proceed?".warning) === false) {
            console.log("Canceled.".info)
            return;
        }
        rimraf.sync(`${destinationDir}/webpack.config.js`);
    }

    // Prepare our directories.
    if (!(await directoryExists(destinationDir))) {
        await fs.promises.mkdir(`${destinationDir}`, {recursive: true});
    }
    await fs.promises.mkdir(`${destinationDir}/.webpack/includes`, {recursive: true});
    await fs.promises.mkdir(`${destinationDir}/.webpack/includes`, {recursive: true});

    // Copy our files over.
    console.log("Setting up webpack files...".info);
    await copyFilesAsync(`${root}/.webpack/includes`, `${destinationDir}/.webpack/includes`);
    await copyFilesAsync(`${root}/.webpack/config.example.yml`, `${destinationDir}/.webpack/config.example.yml`);
    await copyFilesAsync(`${root}/webpack.config.js`, `${destinationDir}/webpack.config.js`);

    // Success message.
    console.log("Successfully created drupal-webpack files in your project.".success);

    // If a config.yml file doesn't exist, we'll create one for the user.
    if (!(await fileExists(`${destinationDir}/.webpack/config.yml`))) {
        await copyFilesAsync(`${root}/.webpack/config.example.yml`, `${destinationDir}/.webpack/config.yml`);
        console.log(`Configuration file was generated at: '${destinationDir}/.webpack/config.yml' - Be sure to check this file before running webpack.`.success);
    }
}

/**
 * This command will...copy the...Yeah, this is the same as the 'install' command for now LOL.
 */
async function update() {
    await install();
}

/**
 * Copy files to a destination, asynchronously.
 *
 * Returns a promise that can be awaited.
 *
 * @param {string} source
 *   Source files to copy.
 * @param {string} destination
 *   Destination to copy these files to.
 */
function copyFilesAsync(source, destination) {
    return new Promise((resolve, reject) => {
        ncp(source, destination, {
            clobber: false,
            stopOnErr: true
        }, async (err) => {
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
}

/**
 * Create a directory at a given path.
 *
 * @param filePath
 *   Path to create directory in.
 *
 * @returns
 *   Returns TRUE if the file exists, FALSE otherwise.
 */
async function fileExists(filePath) {
    return new Promise((resolve) => {
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                resolve(false);
            }
            resolve(true);
        });
    });
}

/**
 * Check if a source path is a directory.
 *
 * @param source
 *   Path of the source file to check.
 * @returns
 *   Returns true if the source is a directory, returns false otherwise.
 */
async function isDirectory(source) {
    return new Promise((resolve) => {
        try {
            resolve(fs.lstatSync(source)
                .isDirectory());
        } catch (error) {
            resolve(false);
        }
    });
}

/**
 * Check if a directory exists at a given path.
 *
 * @param directoryPath
 *   Path to create directory in.
 *
 * @returns
 *   Returns TRUE if the directory exists, FALSE otherwise.
 */
async function directoryExists(directoryPath) {
    if (await fileExists(directoryPath) && !await isDirectory(directoryPath)) {
        return false;
    }

    return fileExists(directoryPath);
}

/**
 * Confirm with the user via the console.
 *
 * @param message
 *   The message to use for the confirmation.
 */
async function confirm(message = `Type in "y" to confirm! Just press enter otherwise.`) {
    const {confirmation} = await prompts(
        {
            initial: false,
            message: message,
            type: "confirm",
            name: 'confirmation',
            onState: gracefulAbort,
        });

    return confirmation;
}

/**
 * Utility function to gracefully abort a Prompt and end execution.
 *
 * @param {Object} state
 *   Prompt state obtained from the prompt's onState listener.
 */
async function gracefulAbort(state) {
    if (state.aborted) {
        console.log('\n');
        process.exit(1);
    }
}