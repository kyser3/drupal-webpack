# Drupal Webpack  [![npm version](https://img.shields.io/npm/v/drupal-webpack?color=%233b83f7)](https://www.npmjs.com/package/drupal-webpack)

[![NPM](https://nodei.co/npm/drupal-webpack.png?compact=true)](https://nodei.co/npm/drupal-webpack/)

This package facilitates the installation of Webpack 5 for Drupal 8+.

Webpack is preconfigured to handle JS & SASS found in custom **Themes** & **Modules**.

The configuration will also handle **Single Directory Components** found within themes.

## Installation

This is a **Node** package and is best installed using [NPM](https://www.npmjs.com/) or 
[Yarn](https://classic.yarnpkg.com/lang/en/docs/install/#mac-stable). You can use `npm init` to generate a 
`package.json` file at the root of your project.

```
npm install -D drupal-webpack
```

```
yarn add -D drupal-webpack
```

## Usage

Perform initial setup using the provided CLI.

```
npm exec druwp install
```

```
yarn druwp install
```

After this is done, refer to the `.webpack/config.yml` file that has been created and adjust it to your liking.

Below are examples of using webpack after it has been configured:

### Compile assets - Will compile only for the default drupal custom theme configured

```
npm exec webpack
```

### Compile assets for a given custom theme

```
npm exec webpack -- --env theme=my_custom_theme
```

### Compile assets for all custom themes

```
npm exec webpack -- --env themes
```

### Compile assets for a given custom module

```
npm exec webpack -- --env module=my_custom_module
```

### Compile assets for all custom modules

```
npm exec webpack -- --env modules
```

## Compiled Assets & Default Behaviour

By default, if the `config.yml` file is left untouched, Webpack will:

* Look for `.js` files at `MY_MODULE/js` or `MY_THEME/js`.
  * If found, JS will be compiled and minified into respective `.min.js` files.
  * e.g. `MY_MODULE/js/MY_MODULE.js` will be compiled into `MY_MODULE/js/MY_MODULE.min.js`.
* Look for `.scss` files at `MY_MODULE/scss` or `MY_THEME/scss`.
  * If found, SCSS will be compiled and minified into respective `.css` files in a new `/css` folder.
  * e.g. `MY_MODULE/scss/MY_MODULE.scss` will be compiled into `MY_MODULE/css/MY_MODULE.css`.
* In themes, any `.js` or `.scss` found within a configured `components` folder for SDC will be compiled as well.

By default, files whose names start with an underscore (`_`) will not be compiled and are intended for imports. 
e.g. `_variables.scss`. This can be changed in the `config.yml`.
