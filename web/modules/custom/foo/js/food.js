// Global page JS.
Drupal.behaviors.food = {
    attach: function (context, settings) {
        once('foo_food', 'html', context).forEach((element) => {
            console.log('Food!');
        });
    }
}