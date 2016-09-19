(function ($) {

Drupal.settings.waves = Drupal.settings.waves || {};
Drupal.settings.waves.btDefaults = {
   hoverIntentOpts: {
     interval: 0,
     timeout: 0
   },
   fill: '#EBEBEB',
   width: '416px',
   cssStyles: {color: '#444444'},
   shrinkToFit: true,
   padding: 12,
   cornerRadius: 0,
   spikeLength: 18,
   spikeGirth: 18,
   strokeWidth: 1,
   strokeStyle: '#BBBBBB',
   shadow: true,
   shadowOffsetX: 2,
   shadowOffsetY: 2,
   shadowBlur: 8,
   shadowColor: 'rgba(0, 0, 0, 0.5)',
   shadowOverlap: false,
   noShadowOpts: {strokeStyle: '#BBBBBB', strokeWidth: 3},
   positions: ['top', 'bottom']
};
$.extend(true, $.bt.defaults, Drupal.settings.waves.btDefaults);

Drupal.behaviors.waves = {
  attach: function (context, settings) {
    // ;login: page.
    $('.view-login .view-content ul.issues li', context)
      .bt({
       contentSelector: "$(this).find('.tip')",
      })
      .find('.tip')
        .hide()
      .end();

    // Tech schedule paper abstract.
    var usenixBtElements = {
      paper: {
        wrapper: '.node-schedule .content .field-name-field-tech-schedule .node-session .field-name-field-session-papers .node-paper',
        title: 'h2.node-title',
        body: '.field-name-field-paper-description-long'
      },
      person: {
        wrapper: '.field-name-field-paper-people',
        title: '.speaker-title.active',
        body: '.speaker-teaser'
      },
      speaker: {
        wrapper: '.field-name-field-chair',
        title: '.speaker-title.active',
        body: '.speaker-teaser'
      }
    }
    for (var i in usenixBtElements) {
      var element = usenixBtElements[i];
      var $elements = $(element.wrapper, context) ;
      $elements.find(element.body).hide() ;

      $elements.find(element.title)
            .each(function (index) {
		if ($(this).next().find(element.body).length) {
		    $(this).bt({
			contentSelector: "$(this).next().find('" + element.body + "')",
		    });
		}
		if ($(this).nextAll('.content').find(usenixBtElements.paper.body).length) {
		    $(this).bt({
			contentSelector: "$(this).nextAll('.content').find('" + usenixBtElements.paper.body + "')",
		    });
		}
            }) ;
    }


      // Add beautytips for speaker bio on training program detail page
      usenixBtElements = {
	  speakerPhoto: {
	      wrapper: '.group-context-node .training-program-photo',
              title: '.node-speaker',
	      body: '.field-type-text-with-summary .field-item'

	  },
      };
      var element = usenixBtElements['speakerPhoto'];
      var $elements = $(element.wrapper, context) ;
      $elements.find(element.title)
          .each(function (index) {
	      if ($(this).find(element.body).length) {
		  $(this).bt({
		      contentSelector: "$(this).find('" + element.body + "')",
		  });
	      }
          }) ;

      usenixBtElements = {
	  speakerName: {
	      wrapper: '.group-context-node .training-program-speaker-bios',
              title: 'a',
	      body: 'p'
	  }
      }
      element = usenixBtElements['speakerName'];
      $elements = $(element.wrapper, context) ;
      $elements.find(element.title)
	  .each(function (index) {
	      if ($(this).nextAll(element.body).first().length) {
		  $(this).bt({
		      contentSelector: "$(this).nextAll('" + element.body + "').first()",
		  });
	      }
          }) ;


      // Add beautytips for BibTeX link on conference paper pages
      usenixBtElements = {
	  bibtexElement: {
	      wrapper: '.node-paper .content',
              link: '.field-name-field-bibtex-node span.bibtex',
	      text: '.field-name-field-text-of-bibtex-entry .field-item'
	  },
      };
      element = usenixBtElements['bibtexElement'];
      $elements = $(element.wrapper, context) ;
      $elements.find(element.link)
          .each(function (index) {
	      if ($(element.wrapper, context).find(element.text).length) {
                  bibtexEntry = $('div.node-paper').find(element.text).text().replace(/\n/g, '<br />');
		  $(this).bt(
                      bibtexEntry,
                      { width: 550,
                        trigger: 'click',
		  });
	      }
          }) ;

      // Style BibTeX link like anchor tags on paper page
      $elements = $(element.wrapper, context) ;
      anchorTag = $elements.find('.field-name-group-audience .field-item a').first();
      bibtexLink = $elements.find(element.link).first();
      bibtexLink.css('color', anchorTag.css('color'));
      bibtexLink.css('border-bottom', anchorTag.css('border-bottom'));


      // Add beautytips for BibTeX link on conference schedule pages
      usenixBtElements = {
	  bibtexElement: {
	      wrapper: '.node-schedule .content',
              link: '.field-name-field-bibtex-node span.bibtex',
	      text: '.field-name-field-text-of-bibtex-entry .field-item'
	  },
      };
      element = usenixBtElements['bibtexElement'];
      $elements = $(element.wrapper, context) ;
      $elements.find(element.link)
          .each(function (index) {
	      if ($(element.wrapper, context).find(element.text).length) {
                  bibtexEntry = $('div.node-schedule').find(element.text).text().replace(/\n/g, '<br />');
		  $(this).bt(
                      bibtexEntry,
                      { width: 550,
                        trigger: 'click',
		  });
	      }
          }) ;

      // Style BibTeX link like anchor tags on conference schedule page
      $elements = $(element.wrapper, context) ;
      anchorTag = $elements.find('.node-paper .node-title a').first();
      bibtexLink = $elements.find(element.link).first();
      bibtexLink.css('color', anchorTag.css('color'));
      bibtexLink.css('border-bottom', anchorTag.css('border-bottom'));

    // File access.
    $('.usenix-files-protected', context)
      .find('.item-list')
        .hide()
      .end()
      .find('.beautytips')
        .bt({
           hoverIntentOpts: {
             timeout: 2000
           },
           contentSelector: "$(this).siblings('.item-list')",
           positions: ['right', 'bottom']
        })
      .end();
  }
};

    // Disable conference theme icon links
    Drupal.behaviors.disableIconLinks = {
	attach: function (context, settings) {
	    var elements = $('div.field-name-taxonomy-vocabulary-14', context);
	    elements = elements.add($('div.views-field-taxonomy-vocabulary-14', context));
	    elements = elements.add($('div.view-conference-organized-by-theme div.view-grouping-header', context));
	    elements = elements.find('img');
	    elements.unwrap();
	    elements.css('float', 'left');
	    elements.css('marginTop', '4px');
	    elements.css('marginRight', '10px');
	    elements.css('marginLeft', '6px');
	}
};

}(jQuery));
