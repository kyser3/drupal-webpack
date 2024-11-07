import "./includes/_world.js";

// Global page JS.
Drupal.behaviors.hello = {
    attach: function (context, settings) {
        once('hello', 'html', context).forEach((element) => {
            console.log('Hello world!');
        });
    }
}
