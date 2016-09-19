/**
 * Creates the default search text and removes it on click.
 */
(function ($) {

Drupal.behaviors.usenixSearch = {
  attach: function(context) {
    $("#search-bar input.form-text").val('Search...').focus(function() {
      if ($(this).val() == 'Search...') {
        $(this).val('');
      }
    });
  }
};

}(jQuery));
