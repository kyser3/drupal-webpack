Drupal.behaviors.components__example = {
  attach: function (context, settings) {
    once('components__example', 'html', context).forEach((element) => {
      console.log('Example component loaded.');
    });
  }
}
