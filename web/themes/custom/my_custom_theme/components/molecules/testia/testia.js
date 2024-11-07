Drupal.behaviors.teardrop__components__example = {
  attach: function (context, settings) {
    once('teardrop__components__example', 'html', context).forEach((element) => {
      console.log('Example component loaded.');
    });
  }
}
