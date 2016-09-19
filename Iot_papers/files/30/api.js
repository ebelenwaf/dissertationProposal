/**
 * @file
 * Embed Open Rev. badge main js file
 */

function createBadge(data) {
	if (data.success) {
		document.getElementById('openrev-ncomments').innerHTML = data.data.n_comments+' Comments';
		document.getElementById('openrev-link').href = data.data.href;
	} else {
		document.getElementById('openrev-link').href = 'https://www.openrev.org/node/add/papers-1-1-0?autofill=badge&db_id=' + encodeURIComponent(or_docID) + '&doi=' + encodeURIComponent(or_docDOI) + '&db=' + encodeURIComponent(or_db) + '&title=' + encodeURIComponent(or_title) + '&authors=' + encodeURIComponent(or_authors) + '&journal=' + encodeURIComponent(or_journal) + '&format=' + encodeURIComponent(or_format) + '&pub_date=' + encodeURIComponent(or_pubdate) + '&pdf_url=' + encodeURIComponent(or_pdfURL) + '&open_access=' + encodeURIComponent(or_openAccess);
	}
}

// add CSS
var cssId = 'openrev-css';
// you could encode the css path itself to generate id..
if (!document.getElementById(cssId)) {
	var head = document.getElementsByTagName('head')[0];
	var link = document.createElement('link');
	link.id = cssId;
	link.rel = 'stylesheet';
	link.type = 'text/css';
	link.href = 'https://www.openrev.org/API/badge/api.css';
	link.media = 'all';
	head.appendChild(link);
}

//create html
document.getElementById('openrev-discuss').innerHTML = '<a id="openrev-link" title="Discuss this document on Open Rev." target="_blank"><img src="https://www.openrev.org/API/badge/or_badge.png"/></a><span id="openrev-ncomments"></span>';

// use JSONP
var script = document.createElement('script');
script.src = 'https://www.openrev.org/api_v_1_0/badge?docID=' + encodeURIComponent(or_docID) + '&docDOI=' + encodeURIComponent(or_docDOI) + '&callback=createBadge';

document.getElementsByTagName('head')[0].appendChild(script);

