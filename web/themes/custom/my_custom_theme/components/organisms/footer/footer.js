Drupal.behaviors.components__footer = {
  attach: function (context, settings) {
    once('components__footer', 'html', context).forEach((element) => {
      console.log('Footer JS loaded.');
    });  }
}
