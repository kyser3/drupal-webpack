import "./includes/_fooled.js";

// Global page JS.
Drupal.behaviors.foo = {
    attach: function (context, settings) {
        once('foo_foo', 'html', context).forEach((element) => {
            console.log('Foo!');
        });
    }
}