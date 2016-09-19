// dash-support.js -- various JavaScript hacks used by DASH presentation.
//  Author: Larry Stone
//  $Revision $

// NOTE: by convention all global identifiers start with "dash" to
// minimize the chance of conflicts with other JS that gets loaded.

// return false on success so link isn't followed
// expected to be the onClick event handler of an A tag, e.g.
//  <a href="foo/bar.html" target="_blank" onclick="javascript:return dashPopup(this);"> ...


function showHiddenCharacters(input)
{
    var hasHiddenChars = false;

    if (input != null) {

        var result = "";
        var text = input.val();

        for(var i=0;i<text.length;i++)
        {
            var currentChar = text.charAt(i);
            var currentCharCode = text.charCodeAt(i);

            if ( currentCharCode==0  || currentCharCode==7 || currentCharCode==12 || currentCharCode==27 || currentCharCode ==127)
            {
                hasHiddenChars = true;
                result+="["+getHiddenCharNameByCode(currentCharCode)+"]";

                if ( currentCharCode==10)
                {
                    result+="\n";
                }
            }
            else
            {
                result+=currentChar;
            }
        }

        if (hasHiddenChars) {
            alert("Abstract has hidden control characters in it. Please review before going further.");
        }
        return result;

    } else {
        // no valid input
    }

}

function getHiddenCharNameByCode(code)
{
    switch(code)
    {
        case 9:
            return "Tab";
            break;
        case 10:
            return "End of Line(LF)";
            break;
        case 13:
            return "End of Line(CR)";
            break;
        case 0:
            return "NULL";
            break;
        case 7:
            return "Bell";
            break;
        case 8:
            return "Backspace";
            break;
        case 12:
            return "Form Feed";
            break;
        case 27:
            return "Escape";
            break;
        case 32:
            return "Space";
            break;
        case 127:
            return "Delete";
            break;
        default:
            return code;

    }
}

function getUrlEncodedFilename(path) {


    var filename = path.split('/').pop();
    //console.log("filename: " + filename);

    var seq = filename.indexOf("?sequence=")

    var encodedFilename = encodeURIComponent(filename);
    //console.log("encoded filename: " + encodedFilename);

    var encodedPath = path.replace(filename,encodedFilename);
    //console.log("encoded path: " + encodedPath);

    encodedPath = encodedPath.replace('%3Fsequence%3D','?sequence=');
    encodedPath = encodedPath.replace('%3fsequence%3d','?sequence=');

    return encodedPath;

}

// Cookies
function createCookie(name, value, days) {
    //console.log("creating cookie with val: " + value);
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        var expires = "; expires=" + date.toGMTString();
    }
    else var expires = "";

    //var fixedName = '<%= Request["formName"] %>';
    //name = fixedName + name;

    document.cookie = name + "=" + encodeURIComponent(value.trim()) + expires + "; path=/";
}

function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0)
            return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
}

function eraseCookie(name) {
    createCookie(name, "", -1);
}

function dashPopup(linktag)
{
    if (!window.focus)
        return true;
    var h = Math.floor(window.outerHeight * 6 / 10);
    var w = Math.floor(window.outerWidth * 8 / 10);
    var win = window.open(linktag.href, "DASH Popup", "width="+w+",height="+h+",toolbar=no,location=no,resizable=yes,scrollbars=yes");
    win.focus();
    return false;
}

// logic to disable embargo date fields when chosen license disallows them
// assumes license=="LAA" is the only enabling condition..
function dashLicenseEnableEmbargo(formID)
{
    var form = document.getElementById(formID);

    // first, figure out chosen license if any:
    var license = null;
    var lr = document.getElementsByName("lic_license_type");
    for (var i = 0; i < lr.length; ++i) {
        if (lr[i].type == "radio" && lr[i].checked) {
            license = lr[i].value;
            break;
        }
    }

    // now apply disable rule to embargo inputs
    var disableEmb =  license != 'LAA';
    var embYear =  form.elements['lic_embargo_year'];
    var embMonth = form.elements['lic_embargo_month'];
    var embDay =   form.elements['lic_embargo_day'];

    embYear.disabled = disableEmb;
    embMonth.disabled = disableEmb;
    embDay.disabled = disableEmb;

    // DEBUG:
    ////console.log("embargo disable = "+disableEmb);
}

//-------------------------- DOI lookup

// Attempt to get DOI automatically by querying CrossRef.  Uses the
// existing Choices interface for the AJAX bit, since that hides the
// CrossRef configuration and password on the server.
//
// Assumptions:
//  - form element 'dc_relation_isversionof' is the target to fill in
//  - choice authority field is bogus "query_doi"
//  - Author in form element 'dc_contributor_author_last' etc (_first, _1, etc)
//  - Title in form element 'dc_title'
//
// FUTURE IMPROVEMENTS:
//  1. This only allows for ONE result.  When there are multiple possible
//     matches it should present a list, either by drop-down or perhaps popup.
//     Probably want to show some details about each DOI with that list.
//  2. The crossref protocol has a more precise mode with more metadata
//     elements, though some of them are hard to get from our elements,
//     e.g. journal issue, page etc.  Could look into whether providing SOME
//     of those fields improves the matching.

function dashLookupDOI(form, contextPath, indicatorID)
{
    var title =  dashStringTrim(form.elements['dc_title'].value);
    // get either first of many names or current value:
    var last = form.elements['dc_contributor_author_last_1']
    if (last == null)
        last = form.elements['dc_contributor_author_last']
    var surname = dashStringTrim(last.value);

    // ID of span for reporting errors
    doiErrorID = "dash-doi-error-message";

    // sanity check: must have title and lastname
    if (title == "")
    {
        alert("You must fill in the Title to look up a DOI.");
        return;
    }
    if (surname == "")
    {
        alert("You must fill in at least the last name of the first author to look up a DOI.");
        return;
    }

    var indicator = indicatorID == null ? null : document.getElementById(indicatorID);
    if (indicator != null)
        indicator.style.display = "inline";

    // query text is: {surname}|{title}
    var query = surname+"|"+title;

    // find span for status respnose
    var statusSpan = document.getElementById(doiErrorID);
    if (statusSpan == null) {
        var sibs = form.elements['dc_relation_isversionof'].parentNode.getElementsByTagName("span");
        for (var i = 0; i < sibs.length; ++i) {
            if (sibs[i].className.match(" ?field-help ?") != null)
                statusSpan = sibs[i];
        }
    } else {
        statusSpan.innerHTML = "";
    }

    new Ajax.Request(contextPath+"/choices/query_doi",
        {
            method: "get",
            parameters: {query: query, format: 'default', start: 0, limit: 1},
            // this is handy since it gives details of errors in callback
            onException: function(req, e) {
                alert("Query for DOI failed with exception!  req.query="+req.parameters.query+", exception="+e);
                if (indicator != null)
                    indicator.style.display = "none";
            },
            onFailure: function() {
                alert("Query for DOI failed in HTTP!");
                if (indicator != null)
                    indicator.style.display = "none";
            },
            // Returned XML is <Choices><Choice authority="key" value="val">label</Choice>...
            onSuccess: function(transport) {
                var root = transport.responseXML.firstChild;
                var choices = root.getElementsByTagName('Choice');
                if (choices.length == 0)
                {
                    if (statusSpan != null)
                    {
                        // simulate "insertAfter"...
                        statusSpan.parentNode.insertBefore(Builder.node("span",
                                {"class": "error", id: doiErrorID }, "* No DOI was found."),
                            statusSpan.nextSibling);
                    }
                }
                else
                {
                    var result = choices.item(0).getAttributeNode('value').value;
                    form.elements['dc_relation_isversionof'].value = result;
                }
                if (indicator != null)
                    indicator.style.display = "none";
            }
        });
}

function loadDialogDiv() {

    var $j = jQuery;
    var previewDialog = '<div id="dialog"><iframe id="previewFrame" style="width:100%; height:100%;" src=""></iframe></div>';
    $j('#ds-main').after(previewDialog);
    $j("#dialog").dialog({
        autoOpen: false,
        show: "fade",
        hide: "fade",
        modal: false,
        height: '300',
        width: '1100',
        resizable: true,
        title: 'Preview',
        position: { my: "right top", at: "right bottom"},
        close: function( event, ui ) {
            $j('#previewFrame').attr('src', '');
        },
        create: function(event, ui) {
            if (localStorage.previewPosition) {
                $j('#dialog').dialog('option','position', JSON.parse(localStorage.previewPosition));
            }
            if (localStorage.previewSize) {
                var pSize = JSON.parse(localStorage.previewSize);
                $j('#dialog').dialog('option','height', pSize.height );
                $j('#dialog').dialog('option','width', pSize.width );
            }
            $j(event.target).parent().css('position', 'fixed');
        },
        dragStop: function(event, ui) {
            localStorage.previewPosition = JSON.stringify(ui.position);
        },
        resizeStop: function(event, ui) {
            var position = [(Math.floor(ui.position.left) - $j(window).scrollLeft()),
                (Math.floor(ui.position.top) - $j(window).scrollTop())];
            $j(event.target).parent().css('position', 'fixed');
            $j('#dialog').dialog('option','position',position);
            localStorage.previewSize = JSON.stringify(ui.size);
            localStorage.previewPosition = JSON.stringify(ui.position);
        }
    });

    $j('#dialog').parent().css({position:"fixed"}).end();

}

function togglePdfDiv(path) {

    var $j = jQuery;

    path = getUrlEncodedFilename(path);

    // toggle the dialog off
    if (localStorage.previewUrl) {
        if ((path == localStorage.previewUrl) && $j("#dialog").dialog("isOpen")) {
            $j("#dialog").dialog("close");
            localStorage.previewUrl = '';
            return;
        }
    }
    localStorage.previewUrl = path;
    $j('#previewFrame').attr('src', path);
    $j("#dialog").dialog("open");

    // $j('#pdf-iframe').toggle();
    // if ($j('#pdf-iframe').is(':hidden')) {
    //     $j('#pdf-div').height(35);
    //     $j('#toggle-doi').show();
    //     $j('#toggle-sherpa').show();
    //     $j('#pdf-div').css('z-index', '-1');
    // } else  {
    //     $j('#pdf-div').height("50%");
    //     $j('#toggle-doi').hide();
    //     $j('#toggle-sherpa').hide();
    //     $j('#pdf-div').css('z-index', '99');
    // }
}

function loadPdfDiv() {

    var pdfDiv = "<div id='pdf-div' style='margin-bottom: 20px; position:fixed; bottom:0; height:35px; width:100%; z-index:-1;'>";
    var pdfIcons = "";

    $j("input[name^='pdfHandle_']").each(function() {
        //console.log($j(this).attr("name") + " - " + $j(this).val());
        if ($j("#pdf-div").length == 0) {
            pdfIcons = pdfIcons + "<span id='toggle-pdf' style='margin-left:8px;'><img src='/themes/dash/images/mime/pdf2.png' onclick='togglePdfDiv(\"" + $j(this).val() + "\");' height='32px'/></span>";
        }
    });
    $j('#ds-main').after(pdfDiv + pdfIcons + "</div>");


    // var pdfHandle = $j('#aspect_submission_StepTransformer_field_pdfHandle').val();

    // if ($j("#pdf-div").length) {
    //     // nothing to do
    // } else {
    //     if (pdfHandle.length > 0) {

    //         var pdfDiv = "<div id='pdf-div' style='margin-bottom: 20px; position:fixed; bottom:0; height:35px; width:100%; z-index:-1;'>" +
    //             "<div id='toggle-pdf' style='margin-left:8px;'><img src='/themes/dash/images/mime/pdf2.png' onclick='togglePdfDiv();' height='32px'/></div>" +
    //             "<iframe id='pdf-iframe' style='display: none; width:100%; height:100%;' src='" +
    //             pdfHandle + "#page=2'/>" +
    //             "</div>";

    //         $j('#ds-main').after(pdfDiv);

    //     }
    // }

}

function toggleDoiDiv(path) {

    window.open(path, '_blank');

    // var $j = jQuery;

    // if (localStorage.previewUrl) {
    //     if ((path == localStorage.previewUrl) && $j("#dialog").dialog("isOpen")) {
    //         $j("#dialog").dialog("close");
    //         localStorage.previewUrl = '';
    //         return;
    //     }
    // }
    // localStorage.previewUrl = path;

    // $j('#previewFrame').attr('src', path);
    // $j("#dialog").dialog("open");

}

function loadDoiDiv() {

    var $j = jQuery;
    var srDiv = "<div id='doi-div' style='margin-bottom: 60px; position:fixed; bottom:0; height:35px; width:100%; z-index:-1;'>";
    var srIcons = "";
    $j("input[name^='dc_relation_isversionof_']").each(function() {
        //console.log($j(this).attr("name") + " - " + $j(this).val());
        if ($j(this).attr("name") != 'dc_relation_isversionof_selected') {
            //console.log("this value: " + $j(this).val());
            var cleanDoi = $j(this).val();
            cleanDoi = cleanDoi.replace("doi://","");
            cleanDoi = cleanDoi.replace("doi:","");
            cleanDoi = cleanDoi.replace("http://dx.doi.org/","");
            //console.log("clean doi: " + cleanDoi);
            if ($j("#doi-div").length == 0) {
                srIcons = srIcons + "<span id='toggle-doi' style='margin-left:8px;'><img " +
                    "alt='" + $j(this).val() + "' " +
                    "src='/themes/dash/images/mime/doi.png' onclick='toggleDoiDiv(\"" +
                    "//dx.doi.org/" + cleanDoi + "\");' height='32px'/></span>";
            }
        }
    });
    $j('#ds-main').after(srDiv + srIcons + "</div>").trigger("create");

    // var $j = jQuery;
    // var doiUrl = "";
    // if ($j("#doi-div").length) {
    //     // nothing to do
    // } else {

    //     if ($j("input[name^='dc_relation_isversionof_']")) {
    //         var countPrev = $j("input[name^='dc_relation_isversionof_']").length/2;
    //         if (countPrev > 0) {
    //             for (var i=1; i < countPrev+1; i++) {
    //                 if ( $j("input[name='dc_relation_isversionof_"+i+"']").val().substring(0,4) == "doi:") {
    //                     doiUrl = "http://dx.doi.org/" + $j("input[name='dc_relation_isversionof_"+i+"']").val().replace("doi:","");
    //                     break;
    //                 }
    //             }
    //         }
    //     }

    //     if (doiUrl.length > 0) {
    //         var doiDiv = "<div id='doi-div' style='margin-bottom: 60px; position:fixed; bottom:0; height:35px; width:100%; z-index:-1;'>" +
    //             "<div id='toggle-doi' style='margin-left: 8px; margin-bottom:25px;'><img src='/themes/dash/images/mime/doi.png' onclick='toggleDoiDiv();' height='32px'/></div>" +
    //             "<iframe sandbox id='doi-iframe' style='display: none; width:100%; height:100%;' src='" + doiUrl + "'/>" +
    //             "</div>";

    //         $j('#ds-main').after(doiDiv).trigger("create");
    //     }
    // }

}


function toggleSherpaDiv(issn) {

    //window.open(path, '_blank');

    var $j = jQuery;
    var path = "https://dash.harvard.edu/sherpa?issn=" + issn;

    if (localStorage.previewUrl) {
        if ((path == localStorage.previewUrl) && $j("#dialog").dialog("isOpen")) {
            $j("#dialog").dialog("close");
            localStorage.previewUrl = '';
            return;
        }
    }
    localStorage.previewUrl = path;

    $j('#previewFrame').attr('src', path);
    $j("#dialog").dialog("open");

}

function loadSherpaDiv() {

    var $j = jQuery;
    var srDiv = "<div id='sherpa-div' style='margin-bottom: 100px; position:fixed; bottom:0; height:35px; width:100%; z-index:-1;'>";
    var srIcons = "";
    $j("input[name^='dc_identifier_issn_']").each(function() {
        //console.log($j(this).attr("name") + " - " + $j(this).val());
        if ($j(this).attr("name") != 'dc_identifier_issn_selected') {
            if ($j("#sherpa-div").length == 0) {
                srIcons = srIcons + "<span id='toggle-sherpa' style='margin-left:8px;'><img " +
                    "alt='" + $j(this).val() + "' " +
                    "src='/themes/dash/images/mime/sherparomeo.png' onclick='toggleSherpaDiv(\"" +
                    $j(this).val() + "\");' height='32px'/></span>";
            }
        }
    });

    $j('#ds-main').after(srDiv + srIcons + "</div>").trigger("create");


    // var sherpaUrl = "";
    // var issnInput = document.getElementsByName("dc_identifier_issn_1")[0];

    // if ($j("#sherpa-div").length) {
    //     // nothing to do
    // } else {

    //     if (issnInput !== undefined) {
    //         //console.log("got issn...");
    //         if ( issnInput.value.length > 0) {
    //             sherpaUrl = "http://www.sherpa.ac.uk/romeo/issn/" + issnInput.value + "/";
    //         }
    //     }

    //     if (sherpaUrl.length > 0) {
    //         var sherpaDiv = "<div id='sherpa-div' style='margin-bottom: 100px; position:fixed; bottom:0; height:35px; width:100%; z-index:-1;'>" +
    //             "<div id='toggle-sherpa' style='margin-left: 8px; margin-bottom:25px;'><img src='/themes/dash/images/mime/sherparomeo.png' onclick='toggleSherpaDiv();' height='32px'/></div>" +
    //             "<iframe id='sherpa-iframe' style='display: none; width:100%; height:100%;' src='" + sherpaUrl + "'/>" +
    //             "</div>";

    //         $j('#ds-main').after(sherpaDiv).trigger("create");
    //     }
    // }

}


function autosizeAbstract() {
    var $j = jQuery;
    var abstract = $j('#aspect_submission_StepTransformer_field_dc_description_abstract');
    $j(abstract).height( $j(abstract)[0].scrollHeight );
}

// replicate java String.trim()
function dashStringTrim(str)
{
    var start = 0;
    var end = str.length;
    for (; str.charAt(start) == ' '&& start < end; ++start) ;
    for (; end > start && str.charAt(end-1) == ' '; --end) ;
    return str.slice(start, end);
}


// BEGIN: INLINE AUTHOR LOOKUP SUPPORTING FUNCTIONS
function toggleAuthorProxy(num) {
    var image = document.getElementsByName("dc_contributor_author_toggle_"+num)[0];
    toggleAuthor(image);
}

function toggleAdvisorProxy(num) {
    var image = document.getElementsByName("dc_contributor_advisor_toggle_"+num)[0];
    toggleAdvisor(image);
}

function expandAuthor(img) {

    var $j = jQuery;
    var src = img.src;
    var num = getAuthorNum(img);
    var select = document.getElementsByName("dc_contributor_author_select_"+num)[0];
    var first = document.getElementsByName("dc_contributor_author_first_temp_"+num)[0];
    var last = document.getElementsByName("dc_contributor_author_last_temp_"+num)[0];
    var interpreted = $j(img).next()[0];
    var saveButton = document.getElementsByName("author_save_choice_"+num)[0];
    var cancelButton = document.getElementsByName("author_cancel_choice_"+num)[0];
    var searchButton = document.getElementsByName("search_"+num)[0];
    var status = $j('#dc_contributor_author_status_'+num)[0];
    var confidenceIcon = $j(status).next()[0];
    var connectionsDiv = document.getElementsByName("connections_div_"+num)[0];

    // EXPAND
    if (src.indexOf("right") > -1) {
        img.src = "/static/icons/arrow-down.png";
        searchButton.style.display = 'inline';
        //interpreted.style.display = 'none';
        if (saveButton) { saveButton.style.display = 'inline'; }
        if (cancelButton) { cancelButton.style.display = 'inline'; }
        //if (connectionsDiv) { connectionsDiv.style.display = 'block'; }
        first.type = 'text';
        $j(first).keypress( function() { document.getElementsByName("author_save_choice_"+num)[0].disabled=false; });
        last.type = 'text';
        $j(last).keypress( function() { document.getElementsByName("author_save_choice_"+num)[0].disabled=false;  });
        // use cached or do ajax lookup
        if (select) {
            select.style.display = 'block';
        } else {
            status.style.display = 'block';
            getAuthorOptions(first.value,last.value,num,interpreted);
        }
    }
}

function collapseAuthor(img) {

    var $j = jQuery;
    var src = img.src;
    var num = getAuthorNum(img);
    var select = document.getElementsByName("dc_contributor_author_select_"+num)[0];
    var first = document.getElementsByName("dc_contributor_author_first_temp_"+num)[0];
    var last = document.getElementsByName("dc_contributor_author_last_temp_"+num)[0];
    var interpreted = $j(img).next()[0];
    var saveButton = document.getElementsByName("author_save_choice_"+num)[0];
    var cancelButton = document.getElementsByName("author_cancel_choice_"+num)[0];
    var searchButton = document.getElementsByName("search_"+num)[0];
    var status = $j('#dc_contributor_author_status_'+num)[0];
    var confidenceIcon = $j(status).next()[0];
    var connectionsDiv = document.getElementsByName("connections_div_"+num)[0];

    // EXPAND
    if (src.indexOf("down") > -1) {
        img.src = "/static/icons/arrow-right.png";
        if (select) { select.style.display = 'none'; }
        searchButton.style.display = 'none';
        first.type = 'hidden';
        last.type = 'hidden';
        if (saveButton) { saveButton.style.display = 'none'; }
        if (cancelButton) { cancelButton.style.display = 'none'; }
        if (connectionsDiv) { connectionsDiv.style.display = 'none'; }
    }
}

function toggleAuthor(img) {

    //console.log("toggleAuthor...");

    var $j = jQuery;
    var src = img.src;
    var num = getAuthorNum(img);
    var select = document.getElementsByName("dc_contributor_author_select_"+num)[0];
    var first = document.getElementsByName("dc_contributor_author_first_temp_"+num)[0];
    var last = document.getElementsByName("dc_contributor_author_last_temp_"+num)[0];
    var interpreted = $j(img).next()[0];
    var saveButton = document.getElementsByName("author_save_choice_"+num)[0];
    var cancelButton = document.getElementsByName("author_cancel_choice_"+num)[0];
    var searchButton = document.getElementsByName("search_"+num)[0];
    var status = $j('#dc_contributor_author_status_'+num)[0];
    var confidenceIcon = $j(status).next()[0];
    var connectionsLink = document.getElementsByName("connections_link_"+num)[0];
    var directoryLink = document.getElementsByName("directory_link_"+num)[0];
    var connectionsDiv = document.getElementsByName("connections_div_"+num)[0];


    // EXPAND
    if (src.indexOf("right") > -1) {
        img.src = "/static/icons/arrow-down.png";
        searchButton.style.display = 'inline';
        //interpreted.style.display = 'none';
        if (saveButton) { saveButton.style.display = 'inline'; }
        if (cancelButton) { cancelButton.style.display = 'inline'; }
//        if (connectionsLink) { connectionsLink.style.display = 'inline'; }
//        if (directoryLink) { directoryLink.style.display = 'inline'; }
        if (connectionsDiv && $j(connectionsLink).attr('href') != '#') {
            connectionsDiv.style.display = 'block';
        }

        first.type = 'text';
        $j(first).keypress( function() { document.getElementsByName("author_save_choice_"+num)[0].disabled=false; });
        last.type = 'text';
        $j(last).keypress( function() { document.getElementsByName("author_save_choice_"+num)[0].disabled=false;  });
        // use cached or do ajax lookup
        if (select) {
            select.style.display = 'block';
        } else {
            status.style.display = 'block';
            getAuthorOptions(first.value,last.value,num,interpreted);
        }
        //confidenceIcon.style.display = 'none';

        // COLLAPSE
    } else {
        img.src = "/static/icons/arrow-right.png";
        if (select) { select.style.display = 'none'; }
        searchButton.style.display = 'none';
        first.type = 'hidden';
        last.type = 'hidden';
        //interpreted.style.display = 'inline';
        //confidenceIcon.style.display = 'inline';
        if (saveButton) { saveButton.style.display = 'none'; }
        if (cancelButton) { cancelButton.style.display = 'none'; }
//        if (connectionsLink) { connectionsLink.style.display = 'none'; }
//        if (directoryLink) { directoryLink.style.display = 'none'; }
        if (connectionsDiv) { connectionsDiv.style.display = 'none'; }

    }
}

function expandAdvisor(img) {

    var $j = jQuery;
    var src = img.src;
    var num = getAuthorNum(img);
    var select = document.getElementsByName("dc_contributor_advisor_select_"+num)[0];
    var first = document.getElementsByName("dc_contributor_advisor_first_temp_"+num)[0];
    var last = document.getElementsByName("dc_contributor_advisor_last_temp_"+num)[0];
    var interpreted = $j(img).next()[0];
    var saveButton = document.getElementsByName("advisor_save_choice_"+num)[0];
    var cancelButton = document.getElementsByName("advisor_cancel_choice_"+num)[0];
    var searchButton = document.getElementsByName("search_advisor_"+num)[0];
    var status = $j('#dc_contributor_advisor_status_'+num)[0];
    var confidenceIcon = $j(status).next()[0];

    // EXPAND
    if (src.indexOf("right") > -1) {
        img.src = "/static/icons/arrow-down.png";
        searchButton.style.display = 'inline';
        if (saveButton) { saveButton.style.display = 'inline'; }
        if (cancelButton) { cancelButton.style.display = 'inline'; }
        first.type = 'text';
        $j(first).keypress( function() { document.getElementsByName("advisor_save_choice_"+num)[0].disabled=false; });
        last.type = 'text';
        $j(last).keypress( function() { document.getElementsByName("advisor_save_choice_"+num)[0].disabled=false;  });
        // use cached or do ajax lookup
        if (select) {
            select.style.display = 'block';
        } else {
            status.style.display = 'block';
            getAdvisorOptions(first.value,last.value,num,interpreted);
        }
    }
}

function collapseAdvisor(img) {

    var $j = jQuery;
    var src = img.src;
    var num = getAuthorNum(img);
    var select = document.getElementsByName("dc_contributor_advisor_select_"+num)[0];
    var first = document.getElementsByName("dc_contributor_advisor_first_temp_"+num)[0];
    var last = document.getElementsByName("dc_contributor_advisor_last_temp_"+num)[0];
    var interpreted = $j(img).next()[0];
    var saveButton = document.getElementsByName("advisor_save_choice_"+num)[0];
    var cancelButton = document.getElementsByName("advisor_cancel_choice_"+num)[0];
    var searchButton = document.getElementsByName("search_advisor_"+num)[0];
    var status = $j('#dc_contributor_advisor_status_'+num)[0];
    var confidenceIcon = $j(status).next()[0];

    // EXPAND
    if (src.indexOf("down") > -1) {
        img.src = "/static/icons/arrow-right.png";
        if (select) { select.style.display = 'none'; }
        searchButton.style.display = 'none';
        first.type = 'hidden';
        last.type = 'hidden';
        if (saveButton) { saveButton.style.display = 'none'; }
        if (cancelButton) { cancelButton.style.display = 'none'; }
    }
}

function toggleAdvisor(img) {

    var $j = jQuery;
    var src = img.src;
    var num = getAuthorNum(img);
    var select = document.getElementsByName("dc_contributor_advisor_select_"+num)[0];
    var first = document.getElementsByName("dc_contributor_advisor_first_temp_"+num)[0];
    var last = document.getElementsByName("dc_contributor_advisor_last_temp_"+num)[0];
    var interpreted = $j(img).next()[0];
    var saveButton = document.getElementsByName("advisor_save_choice_"+num)[0];
    var cancelButton = document.getElementsByName("advisor_cancel_choice_"+num)[0];
    var searchButton = document.getElementsByName("search_advisor_"+num)[0];
    var status = $j('#dc_contributor_advisor_status_'+num)[0];
    var confidenceIcon = $j(status).next()[0];


    // EXPAND
    if (src.indexOf("right") > -1) {
        img.src = "/static/icons/arrow-down.png";
        searchButton.style.display = 'inline';
        //interpreted.style.display = 'none';
        if (saveButton) { saveButton.style.display = 'inline'; }
        if (cancelButton) { cancelButton.style.display = 'inline'; }
        first.type = 'text';
        $j(first).keypress( function() { document.getElementsByName("advisor_save_choice_"+num)[0].disabled=false; });
        last.type = 'text';
        $j(last).keypress( function() { document.getElementsByName("advisor_save_choice_"+num)[0].disabled=false;  });
        // use cached or do ajax lookup
        if (select) {
            select.style.display = 'block';
        } else {
            status.style.display = 'block';
            getAdvisorOptions(first.value,last.value,num,interpreted);
        }
        //confidenceIcon.style.display = 'none';

        // COLLAPSE
    } else {
        img.src = "/static/icons/arrow-right.png";
        if (select) { select.style.display = 'none'; }
        searchButton.style.display = 'none';
        first.type = 'hidden';
        last.type = 'hidden';
        //interpreted.style.display = 'inline';
        //confidenceIcon.style.display = 'inline';
        if (saveButton) { saveButton.style.display = 'none'; }
        if (cancelButton) { cancelButton.style.display = 'none'; }

    }
}

function hasAuthForm(authorityKey) {

    // this is kind of ugyly but...
    var jqXHR = jQuery.ajax({
        type: "GET",
        url: "/aaform?authority=" + authorityKey,
        async: false,
        cache: false,
        timeout: 30000,
        contentType: "text/plain; charset=UTF-8"
    });
    return jqXHR.responseText;
}

function getAuthorOptions(fname,lname,num) {
    var $j = jQuery;

    var query = encodeURI(lname+', '+fname);
    var contextPath = "";
    var url = contextPath + "/choices/dc_contributor_author?format=select&collection=1&start=0&limit=0&query="+query;
    var status = $j('#dc_contributor_author_status_'+num)[0];
    var searchButton = document.getElementsByName("search_"+num)[0];
    var select;
    var saveButtonDisabled = " disabled";
    var authority = document.getElementsByName("dc_contributor_author_authority_"+num)[0];
    var isSelected = "";
    var confidence = document.getElementsByName("dc_contributor_author_confidence_"+num)[0];
    var priorLinks = "";
    var connectionsLink = "";

    if (searchButton) searchButton.style.display = 'none';

    //console.log(url);

    $j.ajax({
        type: "GET",
        url: url,
        contentType: "text/xml; charset=utf-8",
        success: function(data) {
            select = data.documentElement;
        },
        error: function(request, textStatus, errorThrown) {
            //console.log("error: "+errorThrown); 
        },
        complete: function(request, textStatus){

            if (status) status.style.display = 'none';

            var optionNum = $j(select).children('option').length;
            var selectSize = optionNum + 1;
            if (selectSize == 1) selectSize = 2;
            if (selectSize > 10) selectSize = 12;
            var nonAffiliated = "Non-Harvard-affiliated author "+lname+", "+fname;
            var retval = '<select name="dc_contributor_author_select_'+num+'" size="' + selectSize +
                '" style="margin-left: 18px; margin-top: 8px; display: block; width: 500px;" onfocus="this.selectedIndex = -1;" onchange="updateAuthor(this, this.selectedIndex);">';

            // add title attribute for mouse hover text
            //console.log(optionNum);
            $j(select).children('option').each(function() {


                if (authority != null)
                //console.log("this: "+$j(this).attr('authority')+" - "+authority.value);


                    if (authority != null && ($j(this).attr('authority') == authority.value)) {
                        selected = ' selected';
                        if (confidence.value == 'UNCERTAIN') saveButtonDisabled = "";
                        if (optionNum == 1) {
                            // update first and last name text boxes
                            //var first_val = firstNameOf(authority.value);
                            //var last_val = lastNameOf(authority.value);
                            var first_val = firstNameOf($j(this).attr('value'));
                            var last_val = lastNameOf($j(this).attr('value'));

                            //console.log(last_val+', '+first_val);
                            var first_temp = document.getElementsByName("dc_contributor_author_first_temp_"+num)[0];
                            var last_temp = document.getElementsByName("dc_contributor_author_last_temp_"+num)[0];
                            // change the form elements
                            last_temp.value = last_val;
                            first_temp.value = first_val;
                        }
                    } else {

                        //console.log("ok then 1");
                        // auto select the first item if there is only one
                        if (optionNum == 1) {
                            //console.log("ok then 2");
                            selected = ' selected';
                            saveButtonDisabled = "";
                            // update first and last name text boxes
                            var first_val = firstNameOf($j(this).attr('value'));
                            var last_val = lastNameOf($j(this).attr('value'));
                            //console.log(last_val+', '+first_val);
                            var first_temp = document.getElementsByName("dc_contributor_author_first_temp_"+num)[0];
                            var last_temp = document.getElementsByName("dc_contributor_author_last_temp_"+num)[0];
                            // change the form elements
                            last_temp.value = last_val;
                            first_temp.value = first_val;

                        } else {
                            selected = '';
                        }
                    }

                var aaVal = parseInt(hasAuthForm($j(this).attr('authority')));
                var aaString = "&#10008;";
                if (aaVal != null && aaVal > 0) aaString = "&#10004;";
                //console.log("authform: "+authority.value + ' - ' + aaVal + ' - ' + aaString);

                if ($j(this)[0].text.indexOf("Previously-Harvard-affiliated") != -1) {
                    priorLinks += "<a style='margin-left: 25px; font-size: small;' href='/browse?type=harvardAuthor&authority=" +
                        $j(this).attr('authority') + "' target='priorAffiliation'>"+ $j(this)[0].text +"</a><br/>";
                    //console.log("found prior affiliated");
                } else {
                    //console.log("no prior affiliated: " + $j(this)[0].text.indexOf("Prior-Harvard-affiliated"));
                }


                retval += '<option title="'+$j(this)[0].text+'" authority="'+$j(this).attr('authority')+'"'+
                    ' value="'+$j(this).attr('value')+'"'+selected+' ondblclick="saveAuthorChoiceProxy('+num+');">'+
                    aaString + ' ' +
                    $j(this)[0].text+'</option>';
            });

            // no harvard affiliation, select non-affiliated
            if (optionNum == 0) {
                selected = ' selected';
            } else {
                selected = '';
            }

            // harvard connections links
            connectionsLink += "<div name='connections_div_" + num + "' style='display: none;'>" +
                priorLinks +
                "<a name='connections_link_" + num + "' style='margin-left: 25px; font-size: small;' " + "href='#' target='connections'>" +
                "Harvard Connections Profile: <span name='connections_name_" + num +"'></span></a>" +
                "<br>" +
                "<a name='directory_link_" + num + "' style='margin-left: 25px; font-size: small;' " + "href='#' target='directory'>" +
                "Harvard Directory Listing: <span name='directory_name_" + num +"'></span></a>" +
                "</div>";


            retval += '<option title="'+nonAffiliated+'" authority="" value="'+lname+', '+fname+'"'+selected+' ondblclick="saveAuthorChoiceProxy('+num+');">&#10008; '+ nonAffiliated+'</option>';
            retval += '</select>';
            retval += connectionsLink;
            retval += '<button type="button" name="author_save_choice_'+num+'"'+saveButtonDisabled+' style="margin-left: 20px; margin-top: 8px; display: inline;" onclick="saveAuthorChoice(this);">Save</button>';
            retval += '<button type="button" name="author_cancel_choice_'+num+'" style="margin-top: 8px; display: inline;" onclick="cancelChoice(this);">Cancel</button>';

            searchButton.style.display = 'inline';
            $j(searchButton).after(retval);
        }
    });
}

function getAdvisorOptions(fname,lname,num) {
    var $j = jQuery;

    var query = encodeURI(lname+', '+fname);
    var contextPath = "";
    var url = contextPath + "/choices/dc_contributor_author?format=select&collection=1&start=0&limit=0&query="+query;
    var status = $j('#dc_contributor_advisor_status_'+num)[0];
    var searchButton = document.getElementsByName("search_advisor_"+num)[0];
    var select;
    var saveButtonDisabled = " disabled";
    var authority = document.getElementsByName("dc_contributor_advisor_authority_"+num)[0];
    var isSelected = "";
    var confidence = document.getElementsByName("dc_contributor_advisor_confidence_"+num)[0];

    searchButton.style.display = 'none';

    //console.log(url);

    $j.ajax({
        type: "GET",
        url: url,
        contentType: "text/xml; charset=utf-8",
        success: function(data) {
            select = data.documentElement;
        },
        error: function(request, textStatus, errorThrown) {
            //console.log("error: "+errorThrown);
        },
        complete: function(request, textStatus){

            status.style.display = 'none';

            var optionNum = $j(select).children('option').length;
            var selectSize = optionNum + 1;
            if (selectSize == 1) selectSize = 2;
            if (selectSize > 10) selectSize = 12;
            var nonAffiliated = "Non-Harvard-affiliated author "+lname+", "+fname;
            var retval = '<select name="dc_contributor_advisor_select_'+num+'" size="'+ selectSize + '" style="margin-left: 18px; margin-top: 8px; display: block; width: 500px;" onfocus="this.selectedIndex = -1;" onchange="updateAdvisor(this, this.selectedIndex);">';

            // add title attribute for mouse hover text
            $j(select).children('option').each(function() {


                if (authority != null)
                //console.log("this: "+$j(this).attr('authority')+" - "+authority.value);

                    if (authority != null && ($j(this).attr('authority') == authority.value)) {
                        selected = ' selected';
                        if (confidence.value == 'UNCERTAIN') saveButtonDisabled = "";
                        if (optionNum == 1) {
                            // update first and last name text boxes
                            var first_val = firstNameOf($j(this).attr('value'));
                            var last_val = lastNameOf($j(this).attr('value'));

                            //console.log(last_val+', '+first_val);
                            var first_temp = document.getElementsByName("dc_contributor_advisor_first_temp_"+num)[0];
                            var last_temp = document.getElementsByName("dc_contributor_advisor_last_temp_"+num)[0];
                            // change the form elements
                            last_temp.value = last_val;
                            first_temp.value = first_val;
                        }
                    } else {

                        //console.log("ok then 1");
                        // auto select the first item if there is only one
                        if (optionNum == 1) {
                            //console.log("ok then 2");
                            selected = ' selected';
                            saveButtonDisabled = "";
                            // update first and last name text boxes
                            var first_val = firstNameOf($j(this).attr('value'));
                            var last_val = lastNameOf($j(this).attr('value'));
                            //console.log(last_val+', '+first_val);
                            var first_temp = document.getElementsByName("dc_contributor_advisor_first_temp_"+num)[0];
                            var last_temp = document.getElementsByName("dc_contributor_advisor_last_temp_"+num)[0];
                            // change the form elements
                            last_temp.value = last_val;
                            first_temp.value = first_val;

                        } else {
                            selected = '';
                        }
                    }

                retval += '<option title="'+$j(this)[0].text+'" authority="'+$j(this).attr('authority')+
                    '" value="'+$j(this).attr('value')+'"'+selected+' ondblclick="saveAdvisorChoiceProxy('+num+');">'+$j(this)[0].text+'</option>';

            });

            // no harvard affiliation, select non-affiliated
            if (optionNum == 0) {
                selected = ' selected';
            } else {
                selected = '';
            }

            retval += '<option title="'+nonAffiliated+'" authority="" value="'+lname+', '+fname+'"'+selected+' ondblclick="saveAdvisorChoiceProxy('+num+');">'+ nonAffiliated+'</option>';
            retval += '</select>';
            retval += '<button type="button" name="advisor_save_choice_'+num+'"'+saveButtonDisabled+' style="margin-left: 20px; margin-top: 8px; display: inline;" onclick="saveAdvisorChoice(this);">Save</button>';
            retval += '<button type="button" name="advisor_cancel_choice_'+num+'" style="margin-top: 8px; display: inline;" onclick="cancelChoice(this);">Cancel</button>';


            searchButton.style.display = 'inline';
            $j(searchButton).after(retval);
        }
    });

}

function toggleAllAuthors() {

    var button = document.getElementsByName("toggle_all_authors")[0];

    if (button != null) {
        if (button.value == "Expand All") {
            $j.each($j('.author-toggle'),
                function(index,img){
                    expandAuthor(img);
                }
            );
            button.value = "Collapse All";
        } else {
            $j.each($j('.author-toggle'),
                function(index,img){
                    collapseAuthor(img);
                }
            );
            button.value = "Expand All";
        }
    }
}

function toggleAllAdvisors() {

    var button = document.getElementsByName("toggle_all_advisors")[0];

    if (button.value == "Expand All") {
        $j.each($j('.advisor-toggle'),
            function(index,img){
                expandAdvisor(img);
            }
        );
        button.value = "Collapse All";
    } else {
        $j.each($j('.advisor-toggle'),
            function(index,img){
                collapseAdvisor(img);
            }
        );
        button.value = "Expand All";
    }


}
function saveAuthorChoiceProxy(num) {
    var button = document.getElementsByName("author_save_choice_"+num)[0];
    saveAuthorChoice(button);
}
function saveAdvisorChoiceProxy(num) {
    var button = document.getElementsByName("advisor_save_choice_"+num)[0];
    saveAdvisorChoice(button);
}

function saveAuthorChoice(button) {
    var $j = jQuery;
    var num = getAuthorNum(button);
    var first_temp = document.getElementsByName("dc_contributor_author_first_temp_"+num)[0];
    var last_temp = document.getElementsByName("dc_contributor_author_last_temp_"+num)[0];
    var first = document.getElementsByName("dc_contributor_author_first_"+num)[0];
    var last = document.getElementsByName("dc_contributor_author_last_"+num)[0];
    var authority = document.getElementsByName("dc_contributor_author_authority_"+num)[0];
    var select = document.getElementsByName("dc_contributor_author_select_"+num)[0];
    var disclose = document.getElementsByName("dc_contributor_author_toggle_"+num)[0];
    var selected_option = select.options[select.selectedIndex];
    var selected_val = selected_option.value;
    var auth_val = $j(selected_option).attr('authority');
    var interpreted = $j(disclose).next()[0];
    var status = $j('#dc_contributor_author_status_'+num)[0];
    var confidence = document.getElementsByName("dc_contributor_author_confidence_"+num)[0];
    //var confidenceIcon = $j(status).next()[0];
    var confidenceIcon = $j(confidence).nextAll(".ds-authority-confidence").first();
    var depositing_cell = $j(button).closest('tr').find("td:last");
    var depositing_radio = $j(depositing_cell).find('.ds-dash-depositing-author');

    //console.log("new authority: "+auth_val);
    //console.log("new author: "+selected_val);

    authority.value = auth_val;

    first.value = first_temp.value;
    last.value = last_temp.value;
    interpreted.innerText = last_temp.value + ', ' + first_temp.value;

    //console.log("author name: "+interpreted.innerText);

    // update confidence
    $j(depositing_radio).remove();
    if (auth_val != '') {
        //console.log("ACCEPTED");
        confidence.value = "ACCEPTED";
        $j(confidenceIcon).attr("class", "ds-authority-confidence cf-accepted");
        $j(confidenceIcon).attr("title", "xmlui.authority.confidence.description.cf_accepted");
        var radioStr = '<input name="dash_depositing_author" type="radio" class="ds-text-field ds-dash-depositing-author" value="'+auth_val+'">';
        $j(depositing_cell).html(radioStr);
    } else {
        //console.log("unset");
        confidence.value = "UNSET";
        $j(confidenceIcon).attr("class", "ds-authority-confidence cf-unset");
        $j(confidenceIcon).attr("title", "xmlui.authority.confidence.description.cf_unset");

    }

    $j(button).attr("disabled", true);
    toggleAuthor(disclose);
}

function saveAdvisorChoice(button) {
    var $j = jQuery;
    var num = getAuthorNum(button);
    var first_temp = document.getElementsByName("dc_contributor_advisor_first_temp_"+num)[0];
    var last_temp = document.getElementsByName("dc_contributor_advisor_last_temp_"+num)[0];
    var first = document.getElementsByName("dc_contributor_advisor_first_"+num)[0];
    var last = document.getElementsByName("dc_contributor_advisor_last_"+num)[0];
    var authority = document.getElementsByName("dc_contributor_advisor_authority_"+num)[0];
    var select = document.getElementsByName("dc_contributor_advisor_select_"+num)[0];
    var disclose = document.getElementsByName("dc_contributor_advisor_toggle_"+num)[0];
    var selected_option = select.options[select.selectedIndex];
    var selected_val = selected_option.value;
    var auth_val = $j(selected_option).attr('authority');
    var interpreted = $j(disclose).next()[0];
    var status = $j('#dc_contributor_advisor_status_'+num)[0];
    var confidence = document.getElementsByName("dc_contributor_advisor_confidence_"+num)[0];
    //var confidenceIcon = $j(status).next()[0];
    var confidenceIcon = $j(confidence).nextAll(".ds-authority-confidence").first();
    var depositing_cell = $j(button).closest('tr').find("td:last");
    var depositing_radio = $j(depositing_cell).find('.ds-dash-depositing-author');

    //console.log("new authority: "+auth_val);
    //console.log("new author: "+selected_val);

    authority.value = auth_val;

    first.value = first_temp.value;
    last.value = last_temp.value;
    interpreted.innerText = last_temp.value + ', ' + first_temp.value;

    //console.log("advisor name: "+interpreted.innerText);

    // update confidence
    $j(depositing_radio).remove();
    if (auth_val != '') {
        //console.log("ACCEPTED");
        confidence.value = "ACCEPTED";
        $j(confidenceIcon).attr("class", "ds-authority-confidence cf-accepted");
        $j(confidenceIcon).attr("title", "xmlui.authority.confidence.description.cf_accepted");
        var radioStr = '<input name="dash_depositing_author" type="radio" class="ds-text-field ds-dash-depositing-author" value="'+auth_val+'">';
        $j(depositing_cell).html(radioStr);
    } else {
        //console.log("unset");
        confidence.value = "UNSET";
        $j(confidenceIcon).attr("class", "ds-authority-confidence cf-unset");
        $j(confidenceIcon).attr("title", "xmlui.authority.confidence.description.cf_unset");

    }

    $j(button).attr("disabled", true);
    toggleAdvisor(disclose);
}


function doAuthorRefresh(e) {
    var $j = jQuery;
    var num = getAuthorNum(e);
    var select = document.getElementsByName("dc_contributor_author_select_"+num)[0];
    var saveButton = document.getElementsByName("author_save_choice_"+num)[0];
    var cancelButton = document.getElementsByName("author_cancel_choice_"+num)[0];
    var first_temp = document.getElementsByName("dc_contributor_author_first_temp_"+num)[0];
    var last_temp = document.getElementsByName("dc_contributor_author_last_temp_"+num)[0];
    var status = $j('#dc_contributor_author_status_'+num)[0];

    $j(select).remove();
    $j(saveButton).remove();
    $j(cancelButton).remove();
    status.style.display = 'block';
    e.style.display = 'none';

    getAuthorOptions(first_temp.value, last_temp.value, num);
}
function doAdvisorRefresh(e) {
    var $j = jQuery;
    var num = getAuthorNum(e);
    var select = document.getElementsByName("dc_contributor_advisor_select_"+num)[0];
    var saveButton = document.getElementsByName("advisor_save_choice_"+num)[0];
    var cancelButton = document.getElementsByName("advisor_cancel_choice_"+num)[0];
    var first_temp = document.getElementsByName("dc_contributor_advisor_first_temp_"+num)[0];
    var last_temp = document.getElementsByName("dc_contributor_advisor_last_temp_"+num)[0];
    var status = $j('#dc_contributor_v_status_'+num)[0];

    $j(select).remove();
    $j(saveButton).remove();
    $j(cancelButton).remove();
    status.style.display = 'block';
    e.style.display = 'none';

    getAdvisorOptions(first_temp.value, last_temp.value, num);
}

function cancelAuthorChoice(button) {
    var num = getAuthorNum(button);
    var disclose = document.getElementsByName("dc_contributor_author_toggle_"+num)[0];
    toggleAuthor(disclose);
    resetAuthorTemp(num);
    var saveButton = document.getElementsByName("author_save_choice_"+num)[0];
    $j(saveButton).attr("disabled", true);

}
function cancelAdvisorChoice(button) {
    var num = getAuthorNum(button);
    var disclose = document.getElementsByName("dc_contributor_advisor_toggle_"+num)[0];
    toggleAdvisor(disclose);
    resetAdvisorTemp(num);
    var saveButton = document.getElementsByName("advisor_save_choice_"+num)[0];
    $j(saveButton).attr("disabled", true);

}

function resetAuthorTemp(index) {
    var first_temp = document.getElementsByName("dc_contributor_author_first_temp_"+index)[0];
    var last_temp = document.getElementsByName("dc_contributor_author_last_temp_"+index)[0];
    var first = document.getElementsByName("dc_contributor_author_first_"+index)[0];
    var last = document.getElementsByName("dc_contributor_author_last_"+index)[0];
    first_temp.value = first.value;
    last_temp.value = last.value;
}
function resetAdvisorTemp(index) {
    var first_temp = document.getElementsByName("dc_contributor_advisor_first_temp_"+index)[0];
    var last_temp = document.getElementsByName("dc_contributor_advisor_last_temp_"+index)[0];
    var first = document.getElementsByName("dc_contributor_advisor_first_"+index)[0];
    var last = document.getElementsByName("dc_contributor_advisor_last_"+index)[0];
    first_temp.value = first.value;
    last_temp.value = last.value;
}

function updateAuthor(select,index) {

    //console.log("updateAuthor...");

    $j = jQuery;
    var num = getAuthorNum(select);
    var selected = select.options[index];
    var text = $j(selected).text();
    var val = $j(selected).attr("value");
    var auth_val = $j(selected).attr("authority");
    var first_val = firstNameOf(val);
    var last_val = lastNameOf(val);
    var first_temp = document.getElementsByName("dc_contributor_author_first_temp_"+num)[0];
    var last_temp = document.getElementsByName("dc_contributor_author_last_temp_"+num)[0];
    var connections_name = document.getElementsByName("connections_name_"+num)[0];
    var connections_link = document.getElementsByName("connections_link_"+num)[0];
    var connections_div = document.getElementsByName("connections_div_"+num)[0];
    var directory_name = document.getElementsByName("directory_name_"+num)[0];
    var directory_link = document.getElementsByName("directory_link_"+num)[0];

    // change the form elements
    last_temp.value = last_val;
    first_temp.value = first_val;

    // update the connections profile link
    if (auth_val != null && auth_val.length > 1) {

        if (connections_div != null)
            connections_div.style.display = 'block';

        if (connections_name != null)
            connections_name.innerText = last_val + ", " + first_val;
        if (connections_link != null)
            $j(connections_link).attr("href", "https://connections.harvard.edu/profiles/html/advancedSearch.do?displayName="
                + encodeURI(last_val + ", " + first_val));

        if (directory_name != null)
            directory_name.innerText = last_val + ", " + first_val;
        if (directory_link != null)
            $j(directory_link).attr("href", "https://www.directory.harvard.edu/phonebook/submitSearch.do?command_btn=Search&" +
                "lastName=" + last_val + "&firstName=" + first_val.replace(/\s+\S+/g,""));


    } else {

        connections_name.innerText = "";
        $j(connections_link).attr("href","#");

        directory_name.innerText = "";
        $j(directory_link).attr("href","#");

        if (connections_div != null)
            connections_div.style.display = 'none';
    }

    var saveButton = document.getElementsByName("author_save_choice_"+num)[0];
    $j(saveButton).attr("disabled", false);

    ////console.log($j(saveButton).attr("disabled"));
}

function updateAdvisor(select,index) {
    $j = jQuery;
    var num = getAuthorNum(select);
    var selected = select.options[index];
    var text = $j(selected).text();
    var val = $j(selected).attr("value");
    var auth_val = $j(selected).attr("authority");
    var first_val = firstNameOf(val);
    var last_val = lastNameOf(val);
    var first_temp = document.getElementsByName("dc_contributor_advisor_first_temp_"+num)[0];
    var last_temp = document.getElementsByName("dc_contributor_advisor_last_temp_"+num)[0];

    // change the form elements
    last_temp.value = last_val;
    first_temp.value = first_val;

    var saveButton = document.getElementsByName("advisor_save_choice_"+num)[0];
    $j(saveButton).attr("disabled", false);
}

function getAuthorNum(e) {
    var name = e.name;
    var start = name.lastIndexOf("_")+1;
    return name.substr(start);

}

// DSpace person-name conventions, see DCPersonName
function firstNameOf(personName)
{
    var comma = personName.indexOf(",");
    return (comma < 0) ? "" : stringTrim(personName.substring(comma+1));
}

// DSpace person-name conventions, see DCPersonName
function lastNameOf(personName)
{
    var comma = personName.indexOf(",");
    return stringTrim((comma < 0) ? personName : personName.substring(0, comma));
}
// replicate java String.trim()
function stringTrim(str)
{
    var start = 0;
    var end = str.length;
    for (; str.charAt(start) == ' '&& start < end; ++start) ;
    for (; end > start && str.charAt(end-1) == ' '; --end) ;
    return str.slice(start, end);
}
// END: INLINE AUTHOR LOOKUP SUPPORTING FUNCTIONS

// =====================================================================================================================
//   CHECK FOR DUPLICATE TITLE
// =====================================================================================================================
function checkTitle(ta, itemid) {

    $j = jQuery;
    $j('#checkResults').html('');
    var url = "/checktitle?itemid="+itemid+"&title=" + encodeURI(ta.val());

    if (ta.val().length > 1) {

        $j('#checkResults').html("<p><img src='/themes/dash/images/suggest-indicator.gif' />&nbsp;&nbsp;Checking for duplicates...</p>");

        $j.ajax({
            type: "GET",
            url: url,
            contentType: "text/html; charset=utf-8",
            success: function(data) {
                if (/\S/.test(data)) {
                    ////console.log("data: --"+data+"--");
                    $j('#checkResults').html(data);
                    if (data.indexOf("No matching") == -1) {
                        alert("Warning: Potential title duplicate(s) found! Please double-check that this item isn't a duplicate.");
                    }
                } else {
                    $j('#checkResults').html('');
                }
            },
            error: function(request, textStatus, errorThrown) {
            },
            complete: function(request, textStatus){
            }
        });
    }
}

// =====================================================================================================================
//   RUN CHECK TITLE (CHECK COOKIE TO SEE IF IT HAS ALREADY RUN, ETC.)
// =====================================================================================================================
function runCheckTitle() {

    var itemid = $j('#aspect_submission_StepTransformer_field_itemid').val();
    var ta = $j('#aspect_submission_StepTransformer_field_dc_title');
    ta.after('<div id="checkResults"></div>').trigger('create');
    var cookieTitle = readCookie("title");
    var isDifferentTitle = true;

    if (cookieTitle != null && cookieTitle == ta.val()) {
        isDifferentTitle = false;
    } else {
        isDifferentTitle = true;
        createCookie("title",ta.val(),1);
    }

    // this runs on page load
    if (ta.val().length > 1 && isDifferentTitle) {

        //console.log("running checktitle...");

        $j('#checkResults').html("<p><img src='/themes/dash/images/suggest-indicator.gif' />&nbsp;&nbsp;Checking for duplicates...</p>");
        checkTitle(ta,itemid);
    } else {
        //console.log("no need to rerun checktitle...");
    }

}

// =====================================================================================================================
//   GET ELEMENT BY XPATH
// =====================================================================================================================
function getElementByXpath(path) {
    return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
};


// =====================================================================================================================
//   DOI AUTOFILL
// =====================================================================================================================

function addDoiAutofillModal() {

    $j = jQuery;

    var footer = $j('#ds-footer');
    footer.prepend("<div id='doi-dialog' title='DOI Autofill Results'></div>").trigger('create');
    $j( "#doi-dialog" ).dialog({
        autoOpen: false,
        modal: true,
        height: 600,
        width: 800,
        hide: false });

}

function addDoiSpinner() {

    $j = jQuery;
    $j('#doi-dialog').append("<div style='margin-top: 250px;'><center>" +
        "<img style='margin-left: 8px; width: 16px; height: 16px;' id='doiPreviewSpinner' src='/themes/dash/images/suggest-indicator.gif'>" +
        " loading...</center></div>").trigger('create');

}

function closeDoiPreview() {
    $j = jQuery;
    $j("#doi-dialog").empty();
    $j("#doi-dialog").dialog("close");
}

function toggleAutoFill(e) {

    $j = jQuery;
    var id = e.id;
    if (e.checked) {
        $j("#"+id+"_new").css("background-color", "#33ff99");
        $j("#"+id+"_old").css("background-color", "#ff6666");
    } else {
        $j("#"+id+"_new").css("background-color", "#cccccc");
        $j("#"+id+"_old").css("background-color", "#cccccc");
    }

}

function disableAutoFillItem(id) {
    $j = jQuery;
    $j("#"+id).prop('disabled',true);
    $j("#"+id).prop('checked',false);
    $j("#"+id+"_old").css("display", "none");
    $j("#"+id+"_new").css("background-color", "#cccccc");
}

function selectTitle(doi) {
    $j = jQuery;
    $j("#doi_autofill").val(doi);
}

function renderDoiChoices(json) {

    $j = jQuery;

    $j("#doi-dialog").empty();

    $j("#doi-dialog").append("<h3>We found multiple DOIs for the same title, please select one:</h3>");

    // loop
    for (var i=0; i < json.length; i++) {

        var doiValue = json[i].doi.replace("//dx.doi.org/","");

        $j("#doi-dialog").append("<h4><a style='color: blue; text-decoration: underline;' onClick='selectTitle(\"" + doiValue + "\"); doiAutofill(this);'>" + json[i].fullCitation + "</a></h4>");

    }


}

function renderDoiPreview(doi) {

    $j = jQuery;

    // add doi if using title autofill
    if ( $j("#doi_autofill").val().length < 1) {
        $j("#doi_autofill").val(doi["DOI"]);
    }

    $j("#doi-dialog").empty();

    // doi link header    
    $j("#doi-dialog").append("<h3><a style='color: blue; text-decoration: underline;' href='//dx.doi.org/" + doi["DOI"] + "' target='doiAutofill'>" + doi["DOI"] + "</a></h3>");

    // FORM
    $j("#doi-dialog").append("<form id='doiAutofillForm' submit=''>");

    // BUTTONS
    $j("#doi-dialog").append("<button style='margin-top: 35px;' type='button' onClick='commitDoiAutofill();closeDoiPreview();loadDoiDiv();loadSherpaDiv();'>Update selected items</button>");
    $j("#doi-dialog").append("<button type='button' onClick='closeDoiPreview();')>Cancel</button>");

    // ARTICLE TITLE
    $j("#doi-dialog").append("<h3><input id='doiAutofill_dc_title' type='checkbox' checked onclick='toggleAutoFill(this);'>Article Title</h3>");
    $j("#doi-dialog").append("<div id='doiAutofill_dc_title_new' style='margin-left: 25px;padding: 8px; background-color: #33ff99'>" + doi.title + "</div>");
    if ($j('#aspect_submission_StepTransformer_field_dc_title').val() &&
        $j.trim($j('#aspect_submission_StepTransformer_field_dc_title').val()).length > 0)
    {
        $j("#doi-dialog").append("<div id='doiAutofill_dc_title_old' style='margin-left: 25px;text-decoration: line-through; padding: 8px; background-color: #ff6666'>" + $j('#aspect_submission_StepTransformer_field_dc_title').val() + "</div>");
    }
    // disable?
    if (doi.title === $j('#aspect_submission_StepTransformer_field_dc_title').val()) {
        disableAutoFillItem("doiAutofill_dc_title");
    }

    // AUTHORS
    var newAuthorString = "";
    if (doi['author'].length > 0) {
        for (var i=0; i < doi['author'].length; i++) {
            newAuthorString += doi['author'][i]['family'] + ", " + doi['author'][i]['given'];
            if (i+1 != doi['author'].length) {
                newAuthorString += "; ";
            }
        }
    }

    // add doi authors as hidden input fields (to be used by the commit function later)
    var hiddenDoiAuthorString = "";
    if (doi['author'].length > 0) {
        for (var i=0; i < doi['author'].length; i++) {
            hiddenDoiAuthorString += "<input type='hidden' name='doi_dc_contributor_author_last_" + (i+1) + "' value='" + doi['author'][i]['family'] + "'>";
            hiddenDoiAuthorString += "<input type='hidden' name='doi_dc_contributor_author_first_" + (i+1) + "' value='" + doi['author'][i]['given'] + "'>";
            //hiddenDoiAuthorString += "<input type='hidden' name='dc_contributor_author_last_temp_" + (i+1) + "' value='" + doi['author'][i]['family'] + "'>";
            //hiddenDoiAuthorString += "<input type='hidden' name='dc_contributor_author_first_temp_" + (i+1) + "' value='" + doi['author'][i]['given'] + "'>";

        }
    }
    $j("#doi-dialog").append(hiddenDoiAuthorString);

    var previousAuthors = "";
    if ($j("input[name^='dc_contributor_author_last_']")) {
        var countPrev = $j("input[name^='dc_contributor_author_last_']").length/2;
        if (countPrev > 0) {
            for (var i=1; i < countPrev+1; i++) {
                if ($j("input[name='dc_contributor_author_last_"+i+"']").val() !== undefined) {
                    previousAuthors += $j("input[name='dc_contributor_author_last_"+i+"']").val() + ", " + $j("input[name='dc_contributor_author_first_"+i+"']").val();
                    if (i+1 != countPrev+1) {
                        previousAuthors += "; ";
                    }
                }
            }
        }
    }

    $j("#doi-dialog").append("<h3><input id='doiAutofill_dc_contributors' type='checkbox' checked onclick='toggleAutoFill(this);'>Authors</h3>");
    $j("#doi-dialog").append("<div id='doiAutofill_dc_contributors_new' style='margin-left: 25px;padding: 8px; background-color: #33ff99'>" + newAuthorString + "<div>");
    if (previousAuthors != "") {
        $j("#doi-dialog").append("<div id='doiAutofill_dc_contributors_old' style='margin-left: 25px;text-decoration: line-through; padding: 8px; background-color: #ff6666'>" + previousAuthors + "</div>");
    }
    // disable?
    if (newAuthorString === previousAuthors) {
        disableAutoFillItem("doiAutofill_dc_contributors");
    }


    // JOURNAL TITLE
    $j("#doi-dialog").append("<h3><input id='doiAutofill_dc_relation_journal' type='checkbox' checked onclick='toggleAutoFill(this);'>Journal Title</h3>");
    $j("#doi-dialog").append("<div id='doiAutofill_dc_relation_journal_new' style='margin-left: 25px;padding: 8px; background-color: #33ff99'>" + doi['container-title'] + "</div>");
    if ($j('#aspect_submission_StepTransformer_field_dc_relation_journal').val() &&
        $j.trim($j('#aspect_submission_StepTransformer_field_dc_relation_journal').val()).length > 0)
    {
        $j("#doi-dialog").append("<div id='doiAutofill_dc_relation_journal_old' style='margin-left: 25px;text-decoration: line-through; padding: 8px; background-color: #ff6666'>" + $j('#aspect_submission_StepTransformer_field_dc_relation_journal').val() + "</div>");
    }
    // disable?
    if (doi['container-title'] === $j('#aspect_submission_StepTransformer_field_dc_relation_journal').val()) {
        disableAutoFillItem("doiAutofill_dc_relation_journal");
    }

    // ISSN
    var issnfound = false;
    if ($j("input[name='dc_identifier_issn_1']") !== undefined) {
        var issnCnt = $j("input[name^='dc_identifier_issn_']").length/2;
        //console.log("issn count: " + issnCnt);
        if (issnCnt > 0) {
            for (var i=1; i < issnCnt+1; i++) {
                //console.log("new: " + doi['ISSN'][0]);
                //console.log("old: " + $j("input[name='dc_identifier_issn_"+i+"']").val());
                if ( doi['ISSN'][0] === $j("input[name='dc_identifier_issn_"+i+"']").val()) {
                    issnfound = true;
                    //console.log("found it!!");
                    break;
                }
            }
        }
    }
    //console.log("ISSN: "+doi['ISSN']);
    // disable
    if (issnfound == true) {
        $j("#doi-dialog").append("<h3><input id='doiAutofill_dc_identifier_issn_1' type='checkbox' disabled='true' onclick='toggleAutoFill(this);'>ISSN</h3>");
        $j("#doi-dialog").append("<div id='doiAutofill_dc_identifier_issn_1_new' style='margin-left: 25px;padding: 8px; background-color: #cccccc'>" + doi['ISSN'][0] + "</div>");
        // don't disable
    } else {
        $j("#doi-dialog").append("<h3><input id='doiAutofill_dc_identifier_issn_1' type='checkbox' checked onclick='toggleAutoFill(this);'>ISSN</h3>");
        $j("#doi-dialog").append("<div id='doiAutofill_dc_identifier_issn_1_new' style='margin-left: 25px;padding: 8px; background-color: #33ff99'>" + doi['ISSN'][0] + "</div>");
    }

    // CITATION
    $j("#doi-dialog").append("<h3><input id='doiAutofill_dc_identifier_citation' type='checkbox' checked onclick='toggleAutoFill(this);'>Citation</h3>");
    $j("#doi-dialog").append("<div id='doiAutofill_dc_identifier_citation_new' style='margin-left: 25px;padding: 8px; background-color: #33ff99'>" + doi['citation'] + "</div>");
    if ($j('#aspect_submission_StepTransformer_field_dc_identifier_citation').val() &&
        $j.trim($j('#aspect_submission_StepTransformer_field_dc_identifier_citation').val()).length > 0)
    {
        $j("#doi-dialog").append("<div id='doiAutofill_dc_identifier_citation_old' style='margin-left: 25px;text-decoration: line-through; padding: 8px; background-color: #ff6666'>" + $j('#aspect_submission_StepTransformer_field_dc_identifier_citation').val() + "</div>");
    }

    // disable?
    if (new String(doi['citation']).valueOf() === new String($j('#aspect_submission_StepTransformer_field_dc_identifier_citation').val()).valueOf()) {
        disableAutoFillItem("doiAutofill_dc_identifier_citation");
    }

    // PUBLISHER
    $j("#doi-dialog").append("<h3><input id='doiAutofill_dc_publisher' type='checkbox' checked onclick='toggleAutoFill(this);'>Publisher</h3>");
    $j("#doi-dialog").append("<div id='doiAutofill_dc_publisher_new' style='margin-left: 25px;padding: 8px; background-color: #33ff99'>" + doi['publisher'] + "</div>");
    if ($j('#aspect_submission_StepTransformer_field_dc_publisher').val() &&
        $j.trim($j('#aspect_submission_StepTransformer_field_dc_publisher').val()).length > 0)
    {
        $j("#doi-dialog").append("<div id='doiAutofill_dc_publisher_old' style='margin-left: 25px;text-decoration: line-through; padding: 8px; background-color: #ff6666'>" + $j('#aspect_submission_StepTransformer_field_dc_publisher').val() + "</div>");
    }
    // disable?
    if (doi['publisher'] === $j('#aspect_submission_StepTransformer_field_dc_publisher').val()) {
        disableAutoFillItem("doiAutofill_dc_publisher");
    }

    // PUB YEAR
    if (doi['issued']['date-parts'][0][0] != null) {
        $j("#doi-dialog").append("<h3><input id='doiAutofill_dc_date_issued_year' type='checkbox' checked onclick='toggleAutoFill(this);'>Publication Year</h3>");
        $j("#doi-dialog").append("<div id='doiAutofill_dc_date_issued_year_new' style='margin-left: 25px;padding: 8px; background-color: #33ff99'>" + doi['issued']['date-parts'][0][0] + "</div>");
        if ($j('#aspect_submission_StepTransformer_field_dc_date_issued_year').val() &&
            $j.trim($j('#aspect_submission_StepTransformer_field_dc_date_issued_year').val()).length > 0)
        {
            $j("#doi-dialog").append("<div id='doiAutofill_dc_date_issued_year_old' style='margin-left: 25px;text-decoration: line-through; padding: 8px; background-color: #ff6666'>" + $j('#aspect_submission_StepTransformer_field_dc_date_issued_year').val() + "</div>");
        }
        // disable?
        if (doi['issued']['date-parts'][0][0] == $j('#aspect_submission_StepTransformer_field_dc_date_issued_year').val()) {
            disableAutoFillItem("doiAutofill_dc_date_issued_year");
        }
    }

    // TYPE/GENRE
    if (doi['type'] && doi['type'] == 'journal-article') {
        $j("#doi-dialog").append("<h3><input id='doiAutofill_dc_type' type='checkbox' checked onclick='toggleAutoFill(this);'>Type or Genre</h3>");
        $j("#doi-dialog").append("<div id='doiAutofill_dc_type_new' style='margin-left: 25px;padding: 8px; background-color: #33ff99'>Journal Article</div>");
        if ($j('#aspect_submission_StepTransformer_field_dc_type').val() &&
            $j.trim($j('#aspect_submission_StepTransformer_field_dc_type').val()).length > 0)
        {
            $j("#doi-dialog").append("<div id='doiAutofill_dc_type_old' style='margin-left: 25px;text-decoration: line-through; padding: 8px; background-color: #ff6666'>" + $j('#aspect_submission_StepTransformer_field_dc_type').val() + "</div>");
        }
    }
    // disable?
    if ("Journal Article" === $j('#aspect_submission_StepTransformer_field_dc_type').val()) {
        disableAutoFillItem("doiAutofill_dc_type");
    }

    // BUTTONS
    $j("#doi-dialog").append("<button style='margin-top: 35px;' type='button' onClick='commitDoiAutofill();closeDoiPreview();loadDoiDiv();loadSherpaDiv();'>Update selected items</button>");
    $j("#doi-dialog").append("<button type='button' onClick='closeDoiPreview();')>Cancel</button>");

    $j("#doi-dialog").append("</form>");

}

function commitDoiAutofill() {

    $j = jQuery;

    // article title
    if ($j('#doiAutofill_dc_title').attr("checked")) {
        $j('#aspect_submission_StepTransformer_field_dc_title').val($j('#doiAutofill_dc_title_new').text());
        runCheckTitle();
    }

    // journal title
    if ($j('#doiAutofill_dc_relation_journal').attr("checked")) {
        $j('#aspect_submission_StepTransformer_field_dc_relation_journal').val($j('#doiAutofill_dc_relation_journal_new').text());
    }

    // publisher
    if ($j('#doiAutofill_dc_publisher').attr("checked")) {
        $j('#aspect_submission_StepTransformer_field_dc_publisher').val($j('#doiAutofill_dc_publisher_new').text());
    }

    // publication year
    if ($j('#doiAutofill_dc_date_issued_year').attr("checked")) {
        $j('#aspect_submission_StepTransformer_field_dc_date_issued_year').val($j('#doiAutofill_dc_date_issued_year_new').text());
    }

    // type
    if ($j('#doiAutofill_dc_type').attr("checked")) {
        $j('#aspect_submission_StepTransformer_field_dc_type').val($j('#doiAutofill_dc_type_new').text());
    }

    // citation
    if ($j('#doiAutofill_dc_identifier_citation').attr("checked")) {
        $j('#aspect_submission_StepTransformer_field_dc_identifier_citation').val($j('#doiAutofill_dc_identifier_citation_new').text());
    }

    // issn_1
    // var issnFound = false;
    // if ($j('#doiAutofill_dc_identifier_issn_1').attr("checked")) {

    //     $j("input[name='dc_identifier_issn_1']").val($j('#doiAutofill_dc_identifier_issn_1_new').text());
    //     $j("input[value='dc_identifier_issn_1']").next().text($j('#doiAutofill_dc_identifier_issn_1_new').text());

    // }

    // issn
    var found = false;
    if ($j('#doiAutofill_dc_identifier_issn_1').attr("checked")) {
        if ($j("input[name='dc_identifier_issn_1']") !== undefined) {
            var countPrev = $j("input[type='hidden'][name^='dc_identifier_issn_']").length;
            //console.log("issn count: " + countPrev);
            if (countPrev > 0) {
                for (var i=1; i < countPrev+1; i++) {
                    //console.log($j("input[name='dc_identifier_issn_"+i+"']").val());
                    //console.log("new value: " + $j('#doiAutofill_dc_identifier_issn_1_new').text());
                    if ( $j('#doiAutofill_dc_identifier_issn_1_new').text() === $j("input[name='dc_identifier_issn_"+i+"']").val()) {
                        found = true;
                        //console.log("found issn!");
                        break;
                    }
                }
                if (found == false) {
                    //console.log("adding issn now...");
                    var currentIssn = countPrev+1;
                    $j('input[name="submit_dc_identifier_issn_delete"]').parent().prepend(
                        '<input name="dc_identifier_issn_selected" value="dc_identifier_issn_' + currentIssn + '" type="checkbox">' +
                        '<span class="ds-interpreted-field">'+ $j('#doiAutofill_dc_identifier_issn_1_new').text() +'</span><br>'
                    ).trigger("create");
                }

                // no existing issns, add it below field-help span
            } else {
                //console.log("no existing issn, adding it now...");

                $j('input[name="submit_dc_identifier_issn_add"]').parent().append(
                    "<div class='ds-previous-values'>" +
                    "<input name='dc_identifier_issn_selected' value='dc_identifier_issn_1' type='checkbox'>" +
                    "<span class='ds-interpreted-field'>" + $j('#doiAutofill_dc_identifier_issn_1_new').text() + "</span>" +
                    "<br>" +
                    "<input class=\"ds-button-field ds-delete-button\" name=\"submit_dc_identifier_issn_delete\" value=\"Remove selected\" type=\"submit\">" +
                    "<input type=\"hidden\" name=\"dc_identifier_issn_1\" value=\"" + $j('#doiAutofill_dc_identifier_issn_1_new').text() + "\">" +
                    "</div>"
                ).trigger("create");
            }
        }
    }

    // doi  
    // 10.1001/archneur.1991.00530140033014 
    found = false;
    if ($j("input[name^='dc_relation_isversionof_']")) {
        var countPrev = $j("input[name^='dc_relation_isversionof_']").length/2;
        //console.log("count: " + countPrev);
        if (countPrev > 0) {
            for (var i=1; i < countPrev+1; i++) {
                //console.log($j("input[name='dc_relation_isversionof_"+i+"']").val());
                if ( $j("#doi_autofill").val().replace("doi:","") === $j("input[name='dc_relation_isversionof_"+i+"']").val().replace("doi:","")) {
                    found = true;
                    //console.log("found it!");
                    break;
                }
            }
            if (found == false) {
                //console.log("adding it now...");
                var currentDoi = countPrev+1;
                $j('input[name="submit_dc_relation_isversionof_delete"]').parent().prepend(
                    '<input name="dc_relation_isversionof_selected" value="dc_relation_isversionof_' + currentDoi + '" type="checkbox">' +
                    '<span class="ds-interpreted-field">doi:'+ $j("#doi_autofill").val().replace("doi:","") +'</span><br>'
                ).trigger("create");
            }

            // no existing dc_relations, add it below field-help span
        } else {

            $j('input[name="lookup_dc_relation_isversionof"]').parent().append(
                "<div class='ds-previous-values'>" +
                "<input name='dc_relation_isversionof_selected' value='dc_relation_isversionof_1' type='checkbox'>" +
                "<span class='ds-interpreted-field'>doi:" + $j("#doi_autofill").val().replace("doi:","") + "</span>" +
                "<br>" +
                "<input class=\"ds-button-field ds-delete-button\" name=\"submit_dc_relation_isversionof_delete\" value=\"Remove selected\" type=\"submit\">" +
                "<input type=\"hidden\" name=\"dc_relation_isversionof_1\" value=\"doi:" + $j("#doi_autofill").val().replace("doi:","") + "\">" +
                "</div>"
            ).trigger("create");
        }
    }

    // authors
    if ($j('#doiAutofill_dc_contributors').attr("checked")) {

        var authorString = "";
        var family = "";
        var given = "";
        var authCount = $j("input[name^='doi_dc_contributor_author_']").length/2;

        for (var i=1; i < authCount+1; i++) {

            family = $j("input[name='doi_dc_contributor_author_last_" + i + "']").val();
            given = $j("input[name='doi_dc_contributor_author_first_" + i + "']").val();

            //console.log("Author: " + family + ", " + given);

            var count = i;
            authorString +=
                '<tr class="ds-table-row odd">' +
                '<td align="center">' +
                '<input name="dc_contributor_author_selected" value="dc_contributor_author_' + count + '" type="checkbox">' +
                '<input type="hidden" name="dc_contributor_author_last_' + count + '" value="' + family + '">' +
                '<input type="hidden" name="dc_contributor_author_first_' + count + '" value="' + given + '">' +
                '</td>' +
                '<td>' +
                '<input class="ds-authority-value " type="text" readonly="readonly" name="dc_contributor_author_authority_' + count +
                '" value="" onchange="javascript: return DSpaceAuthorityOnChange(this, \'aspect_submission_StepTransformer_field_dc_contributor_author_confidence\',\'\');">' +
                '<input type="hidden" class="ds-authority-confidence-input" name="dc_contributor_author_confidence_' + count +'" value="UNSET">' +
                '<img class="author-toggle" name="dc_contributor_author_toggle_' + count + '" style="width: 8px; height: 8px; margin-right: 5px;" src="/static/icons/arrow-right.png" onclick="toggleAuthor(this);">' +
                '<span class="ds-interpreted-field">' + family + ', ' + given + '</span>' +
                '<img src="/themes/dash/images/invisible.gif" class="ds-authority-confidence cf-unset " title="xmlui.authority.confidence.description.cf_unset"><br>' +
                '<input type="hidden" style="margin-left: 18px;" name="dc_contributor_author_last_temp_' + count + '" value="' + family + '">' +
                '<input type="hidden" name="dc_contributor_author_first_temp_' + count + '" value="' + given + '">' +
                '<button type="button" name="search_' + count + '" style="margin-left: 8px; margin-top: 8px; display: none;" onclick="doAuthorRefresh(this);">Lookup</button>' +
                '<div id="dc_contributor_author_status_' + count + '" style="display: none;">' +
                '<p><img style="width: 16px; height: 16px;" src="/themes/dash/images/suggest-indicator.gif">&nbsp;&nbsp;Searching...</p></div>' +
                '</td>' +
                '<td align="center"></td>' +
                '</tr>';
        }

        var table = '<table class="dash-author-values" style="width: 95%;">' +
            '<tbody><tr class="ds-table-header-row">' +
            '<th align="center" width="5%">' +
            '<input checked="true" disabled="true" name="__ignore" type="checkbox">' +
            '</th>' +
            '<th align="center" width="65%">Author Name</th>' +
            '<th align="center" width="30%">Depositing Author</th>' +
            '</tr>' +
            authorString +
            '</tbody></table>';

        // pre-existing authors:
        if ($j('.dash-author-values').length) {

            //console.log("found dash-author-values");

            // zap previous hidden input fields too
            var hiddenAuthCount = $j("input[name^='dc_contributor_author_']").length/2;
            for (var i=1; i < hiddenAuthCount+1; i++) {
                $j('input[name="dc_contributor_author_last_'+i+'"]').remove();
                $j('input[name="dc_contributor_author_first_'+i+'"]').remove();
            }

            $j('.dash-author-values').first().replaceWith(table).trigger('create');


            // no pre-existing authors found
        } else {

            var authorHelpXpath = "//*[@id='aspect_submission_StepTransformer_list_submit-describe']/ol[2]/li[4]/div/div/span";
            var authorHelp = getElementByXpath(authorHelpXpath);
            if (authorHelp != null) {
                //console.log("found authorhelp");
                $j(authorHelp).after("<div class='ds-previous-values'>" + table +
                    "<input class='ds-button-field ds-delete-button' name='submit_dc_contributor_author_delete' value='Remove selected' type='submit'>" +
                    "<input type='button' name='toggle_all_authors' value='Expand All' onclick='toggleAllAuthors();''>" +
                    "</div>").trigger('create');
            }
        }

        toggleAllAuthors();

    }

}


function doiAutofill(e) {
    $j = jQuery;

    var d = $j('#doi_autofill').val();

    $j.ajax({
        type: "GET",
        url: "/doiproxy?doi=" + d,
        dataType: "json",
        beforeSend: function() {
            $j("#doi-dialog").empty();
            addDoiSpinner();
            $j( "#doi-dialog" ).dialog("open");
            $j('#doiPreviewSpinner').show();
        },
        success: function(doi) {
            renderDoiPreview(doi);
            $j('#doiPreviewSpinner').hide();
        },
        error: function(request, textStatus, errorThrown) {
            $j("#doi-dialog").empty();
            $j("#doi-dialog").append("<p>Sorry, that DOI: '<b>" + d + "</b> could not be found.</p><p>Please double check that it is accurate.</p>");
        },
        complete: function(request, textStatus){
            //$j('#doiSpinner').hide();

        }

    });

}

function titleAutofill() {
    $j = jQuery;

    var title = $j('#aspect_submission_StepTransformer_field_dc_title').val();

    if (title.length > 0) {
        $j.ajax({
            type: "GET",
            url: "/doiproxy?title=" + encodeURI(title),
            dataType: "json",
            beforeSend: function() {
                $j("#doi-dialog").empty();
                addDoiSpinner();
                $j( "#doi-dialog" ).dialog("open");
                $j('#doiPreviewSpinner').show();
            },
            success: function(doi) {
                if (typeof doi[0] === "undefined") {
                    renderDoiPreview(doi);
                } else {
                    renderDoiChoices(doi);
                }
                $j('#doiPreviewSpinner').hide();
            },
            error: function(request, textStatus, errorThrown) {
                console.log("doiproxy error: " + errorThrown);
                $j("#doi-dialog").empty();
                $j("#doi-dialog").append("<p>Sorry, a DOI could not be found for that title.</p>");
            },
            complete: function(request, textStatus){
                //$j('#doiSpinner').hide();
            }
        });
    }
}

function getAuthorRow(fname, lname, num) {

    var row =

        '<tr class="ds-table-row odd">' +
        '<td align="center">' +
        '<input name="dc_contributor_author_selected" value="dc_contributor_author_' + num + '" type="checkbox">' +
        '<input type="hidden" name="dc_contributor_author_last_' + num + '" value="' + lname + '">' +
        '<input type="hidden" name="dc_contributor_author_first_' + num + '" value="' + fname + '">' +
        '</td>' +
        '<td>' +
        '<input class="ds-authority-value " type="text" readonly="readonly" name="dc_contributor_author_authority_' + num +
        '" value="" onchange="javascript: return DSpaceAuthorityOnChange(this, \'aspect_submission_StepTransformer_field_dc_contributor_author_confidence\',\'\');">' +
        '<input type="hidden" class="ds-authority-confidence-input" name="dc_contributor_author_confidence_' + num +'" value="UNSET">' +
        '<img class="author-toggle" name="dc_contributor_author_toggle_'+num+'" style="width: 8px; height: 8px; margin-right: 5px;" src="/static/icons/arrow-right.png" onclick="toggleAuthor(this);">' +
        '<span class="ds-interpreted-field" onclick="toggleAuthorProxy('+num+');">' + lname + ', ' + fname + '</span>' +
        '<img src="/themes/dash/images/invisible.gif" class="ds-authority-confidence cf-unset " title="xmlui.authority.confidence.description.cf_unset"><br>' +
        '<input type="hidden" style="margin-left: 18px;" name="dc_contributor_author_last_temp_' + num + '" value="' + lname + '">' +
        '<input type="hidden" name="dc_contributor_author_first_temp_' + num + '" value="' + fname + '">' +
        '<button type="button" name="search_' + num + '" style="margin-left: 8px; margin-top: 8px; display: none;" onclick="doAuthorRefresh(this);">Lookup</button>' +
        '<div id="dc_contributor_author_status_' + num + '" style="display: none;">' +
        '<p><img style="width: 16px; height: 16px;" src="/themes/dash/images/suggest-indicator.gif">&nbsp;&nbsp;Searching...</p></div>' +
        '</td>' +
        '<td align="center"></td>' +
        '</tr>';

    return row;
}

function lookupAndAddAction() {

    $j = jQuery;
    var table = $j('.dash-author-values').first();
    var lname = document.getElementsByName("dc_contributor_author_last")[0].value;
    var fname = document.getElementsByName("dc_contributor_author_first")[0].value;
    var newAuthorNum = $j('.author-toggle').length + 1;

    //console.log("author num = " + newAuthorNum);

    if (lname && fname) {
        var row = getAuthorRow(fname, lname, newAuthorNum);
        if (table.length) {
            $j('table[class=dash-author-values] tr:last').after(row).trigger('create');
        } else {
            var div = $j('input[name=lookup_dc_contributor_author]').parent();
            div.append(
                '<table class="dash-author-values" style="width: 95%;">' +
                '<tbody>' +
                '<tr class="ds-table-header-row">' +
                '<th align="center" width="5%">' +
                '<input checked="true" disabled="true" name="__ignore" type="checkbox">' +
                '</th>' +
                '<th align="center" width="65%">Author Name</th>' +
                '<th align="center" width="30%">Depositing Author</th>' +
                '</tr>' +
                row +
                '</tbody>' +
                '</table>' +
                '<input class="ds-button-field ds-delete-button" name="submit_dc_contributor_author_delete" value="Remove selected" type="submit">' +
                '<input type="button" name="toggle_all_authors" value="Expand All" onclick="toggleAllAuthors();">'
            ).trigger('create');

        }
        $j("#aspect_submission_StepTransformer_field_dc_contributor_author_last").val("");
        $j("#aspect_submission_StepTransformer_field_dc_contributor_author_first").val("");

        toggleAuthorProxy(newAuthorNum);

    } else {
        alert("Please specify a first and last name");
    }


}

// =====================================================================================================================
//   ADD EXPAND ALL AUTHORS/ADVISORS BUTTON
// =====================================================================================================================
function addExpandAllAuthorsButton() {

    var deleteAuthorsButton = document.getElementsByName("submit_dc_contributor_author_delete")[0];
    var deleteAdvisorsButton = document.getElementsByName("submit_dc_contributor_advisor_delete")[0];
    var authorButton =
        '<input type="button" name="toggle_all_authors" value="Expand All" onClick="toggleAllAuthors();"/>';
    var advisorButton =
        '<input type="button" name="toggle_all_advisors" value="Expand All" onClick="toggleAllAdvisors();"/>';

    if (deleteAuthorsButton != null)
        $j(deleteAuthorsButton).after(authorButton).trigger('create');

    if (deleteAdvisorsButton != null)
        $j(deleteAdvisorsButton).after(advisorButton).trigger('create');

}
// =====================================================================================================================
//   TITLE CASE CONVERSION
// =====================================================================================================================
/*
 * To Title Case 2.1 – http://individed.com/code/to-title-case/
 * Copyright © 2008–2013 David Gouch. Licensed under the MIT License.
 */

String.prototype.toTitleCase = function(){
    var smallWords = /^(a|an|and|as|at|but|by|en|for|if|in|nor|of|on|or|per|the|to|vs?\.?|via)$/i;

    return this.replace(/[A-Za-z0-9\u00C0-\u00FF]+[^\s-]*/g, function(match, index, title){
        if (index > 0 && index + match.length !== title.length &&
            match.search(smallWords) > -1 && title.charAt(index - 2) !== ":" &&
            (title.charAt(index + match.length) !== '-' || title.charAt(index - 1) === '-') &&
            title.charAt(index - 1).search(/[^\s-]/) < 0) {
            return match.toLowerCase();
        }

        if (match.substr(1).search(/[A-Z]|\../) > -1) {
            return match;
        }

        return match.charAt(0).toUpperCase() + match.substr(1);
    });
};

function titleCase(type) {

    var e;
    if (type == 'article') {
        e = $j('#aspect_submission_StepTransformer_field_dc_title');
    } else {
        e = $j('#aspect_submission_StepTransformer_field_dc_relation_journal');
    }

    var title = jQuery(e).val();

    // case fold to lower if all caps before calling toTitleCase()
    if (title.toUpperCase() == title) {
        title = title.toLowerCase();
    }
    var tc = title.toTitleCase();
    jQuery(e).val(tc);
}

// =====================================================================================================================
//   ON BEFORE UNLOAD
// =====================================================================================================================

$(window).on('beforeunload', function() {
    //console.log("beforeunload...");

    MathJax.Hub.Config({
        tex2jax: {inlineMath: [['\\(','\\)']]}
    });
    MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
});


// =====================================================================================================================
//   ON DOCUMENT READY
// =====================================================================================================================

$(document).ready(function() {

    var $j = jQuery; // necessary because of $ conflict with prototype.

    //console.log("document ready...");


    // remap the add author button to avoid old popup ui
    var lookupButton = document.getElementsByName("lookup_dc_contributor_author")[0];
    if (lookupButton) {
        $j(lookupButton).attr("onclick", "lookupAndAddAction();");
    }

    var isDescribeStep = false;

    var legend = $j('fieldset:visible legend').text();
    if (legend != null && legend == 'Describe Item') {
        isDescribeStep = true;
    }
    var firstButton = getElementByXpath('//*[@id="aspect_submission_StepTransformer_list_submit-progress"]/li[1]');
    if (firstButton != null && firstButton.className.match("current first button") != null) {
        isDescribeStep = true;
    }

    MathJax.Hub.Config({
        tex2jax: {inlineMath: [['\\(','\\)']]}
    });
    MathJax.Hub.Queue(["Typeset",MathJax.Hub]);

    // initialise writemaths on all elements with class 'ds-textarea-field'
    $j('.ds-textarea-field').writemaths();

    addDoiAutofillModal();

    // DOI AUTO-FILL FORM
    var describe = $j('#article');

    var doiSrc = "<strong>DOI (optional):</strong> <input id='doi_autofill' name='doi_autofill' type='text' size='75'/> " +
        "<button type='button' name='doi' style='display:inline; float:right; font-size: .75em;' onClick='doiAutofill(this);'>Autofill</button>" +
        "<img style='margin-left: 8px; display: none; width: 16px; height: 16px;' id='doiSpinner' src='/themes/dash/images/suggest-indicator.gif'>" +
        "<br/><i style='font-size: 11px;'>Example: 10.1371/journal.pone.0037454</i>";

    var doiLookupPara = Builder.node("p", doiSrc ), progressList;

    var describeHeader = $j('#ui-accordion-article-header-0');
    if (describeHeader !== null) {
        describeHeader.prepend("<p><strong>DOI (optional):</strong> <input id='doi_autofill' name='doi_autofill' type='text' size='75'/> " +
            "<button type='button' name='doi' style='display:inline; float:right; font-size: .75em;' onClick='doiAutofill(this);'>Autofill</button>" +
            "<img style='margin-left: 8px; display: none; width: 16px; height: 16px;' id='doiSpinner' src='/themes/dash/images/suggest-indicator.gif'>" +
            "<br/><i style='font-size: 11px;'>Example: 10.1371/journal.pone.0037454</i></p>");
    } else {
        //console.log("Can't find describeHeader yet...");
    }

    //var describe = $j('#aspect_submission_StepTransformer_list_submit-describe');
    // describe.prepend("<p><strong>DOI (optional):</strong> <input id='doi_autofill' name='doi_autofill' type='text' size='75'/> " +
    //     "<button type='button' name='doi' style='display:inline; float:right;' onClick='doiAutofill(this);'>Autofill</button>" +
    //     "<img style='margin-left: 8px; display: none; width: 16px; height: 16px;' id='doiSpinner' src='/themes/dash/images/suggest-indicator.gif'>" +
    //     "<br/><i style='font-size: 11px;'>Example: 10.1371/journal.pone.0037454</i></p>");

    // is there a doi already?
    var doi = $j('[name="dc_relation_isversionof_1"]').val();
    //console.log("doi: " + doi);
    var autofillElement = $j('#doi_autofill');
    if (typeof doi === "undefined") {
        // can't find doi
    } else {
        if (doi.length > 1) {
            autofillElement.val(doi);
            //doiAutofill(autofillElement);
        }
    }

    var journalTitle = $j('#aspect_submission_StepTransformer_field_dc_relation_journal');
    $j(journalTitle).width(495);
    $j(journalTitle).after('<div style="display: none;" id="srLink"><a id="srLinkTag" href="" target="sherpaRomeoLink">Link to Sherpa/Romeo</a></div>').trigger('create');


    $j(function() {
        $j( journalTitle ).autocomplete({
            minLength: 4,
            //source: "/rest/sherpa",
            source: data,
            search: function(event,ui){
                //$j('#checkSherpa').html("<p><img src='/themes/dash/images/suggest-indicator.gif' />&nbsp;&nbsp;Checking Sherpa/Romeo...</p>");
            },
            response: function(event,ui){
                //$j('#checkSherpa').html("");
            },
            select: function(event,ui){

                //console.log("issn: "+ ui.item.issn);
                this.value = ui.item.label;
                $j("#aspect_submission_StepTransformer_field_dc_identifier_issn").val(ui.item.issn);
                var jPublisher = ui.item.publisher;
                if (jPublisher != "") $j("#aspect_submission_StepTransformer_field_dc_publisher").val(jPublisher);
                var jColor =  ui.item.color;
//                var cText = "";
//                if (jColor == "green") cText = "Green: Can archive pre-print and post-print or publisher's version/PDF.";
//                if (jColor == "blue") cText = "Blue: Can archive post-print (ie: final draft post-refereeing or publisher's version/PDF).";
//                if (jColor == "yellow") cText =  "Yellow: Can archive pre-print (ie: pre-refereeing).";
//                if (jColor == "white") cText = "White: Archiving not formally supported.";
//                if (jColor == "gray") cText = "Gray: In review, closed-door, non-responding or other.";
//                if (jColor != "") {
//                    var fontColor = "black";
//                    $j('#journalType').attr('style', "margin: 5px; padding: 5px; width: 480px; font-size: 12px; color: "+fontColor+"; display: block; background-color: "+jColor+";");
//                    $j("#journalType")[0].innerText = cText;
//
//                }
                document.getElementById("srLink").style.display = "block";
                $j('#srLinkTag').attr('href',"//www.sherpa.ac.uk/romeo/issn/"+ui.item.issn+"/");

                return false;
            }
        });
    });

    var itemid = $j('#aspect_submission_StepTransformer_field_itemid').val();
    //console.log("itemid: "+itemid);

    // Hack to fix lookup and add author button. WARNING: easier to understand than the deep magic of coocon, but fragile.
    $j.each($j('.ds-dash-depositing-author'),function(index,radioButton ){
        // if the depositing author input is checked...
        if ( radioButton.checked ) {
            // remove the extra label element that is messing things up.
            $j('#aspect_submission_StepTransformer_field_dc_contributor_author_confidence_indicator').unwrap();
        };
    });

    // darker darks.
    if ( ($('#noaccess') != null && $('#noaccess').length) || ($('#embargo') != null && $('#embargo').length ) ) {
        $('#downloadlink a').contents().unwrap();
        $('#downloadlink img').remove();
        var why = "An author may deposit a work in DASH in order to preserve it and make it more discoverable by search engines, yet still restrict public access to the file.";
        why += " Although you cannot access the full-text of this work in DASH, you may be able to access it elsewhere by following links provided to the published version or other";
        why += " available versions.";
        $('#noaccess_why').click(function(event) { event.preventDefault(); });
        $('#noaccess_why').tipsy({gravity: 'n',fade: true, html: true, fallback: why  });
    }

    // addthis social bookmarking. horrible hack to get around xsl insisting on self-closing tags.
    var ids = [ '#addthis1', '#addthis2', '#addthis3', '#addthis4','#addthis5','#addthis6'];
    for ( var i=0; i < ids.length; i++ ){
        var id = ids[i];
        if ( ($(id) != null) && ($(id).length > 0) ) {
            $(id).html($(id).html().replace(".",""));
        }
    }

    // ADD EXPAND-ALL BUTTONS
    addExpandAllAuthorsButton();

    // INJECT INLINE AUTHOR LOOKUPS
    $j.each($j('.ds-interpreted-field'),
        function(index,span){

            // need to distinguish between author and advisors here...
            //var confidence = $j(span).prevAll('[name="dc_contributor_author_confidence_1"]');
            //var confidence = document.getElementsByName("dc_contributor_author_confidence_1")[0];
            var confidence = $j(span).prevAll("input.ds-authority-confidence-input:first")[0];
            //var confidenceIcon = $j(span).nextAll("img.ds-authority-confidence:first")[0];

            if (confidence) {
                ////console.log("Confidence: ");
                ////console.log($j(confidence));
                var num = getAuthorNum(confidence);

                ////console.log($j(confidence).attr('name'));

                if ($j(confidence).attr('name') == 'dc_contributor_author_confidence_' + num) {

                    ////console.log("is author");
                    var last = document.getElementsByName("dc_contributor_author_last_"+num)[0];
                    var first = document.getElementsByName("dc_contributor_author_first_"+num)[0];
                    var authorConfidencIcon = $j(confidence).nextAll("img.ds-authority-confidence:first")[0];

                    $j(span).attr("onclick","toggleAuthorProxy("+num+");");
                    $j(span).before('<img class="author-toggle" name="dc_contributor_author_toggle_'+num+'" style="width: 8px; height: 8px; margin-right: 5px;" src="/static/icons/arrow-right.png" onclick="toggleAuthor(this);" />');
                    $j(authorConfidencIcon).after('<div id="dc_contributor_author_status_'+num+'" style="display: none;"><p><img style="width: 16px; height: 16px;" src="/themes/dash/images/suggest-indicator.gif" />&nbsp;&nbsp;Searching...</p></div>');
                    $j(authorConfidencIcon).after('<button type="button" name="search_'+num+'" style="margin-left: 8px; margin-top: 8px; display: none;" onclick="doAuthorRefresh(this);">Lookup</button>');
                    $j(authorConfidencIcon).after('<input type="hidden" name="dc_contributor_author_first_temp_'+num+'" value="'+first.value+'"/>');
                    $j(authorConfidencIcon).after('<br/><input type="hidden" style="margin-left: 18px;" name="dc_contributor_author_last_temp_'+num+'" value="'+last.value+'"/>');

                } else if ($j(confidence).attr('name') == 'dc_contributor_advisor_confidence_' + num) {

                    ////console.log("is advisor");
                    var last = document.getElementsByName("dc_contributor_advisor_last_"+num)[0];
                    var first = document.getElementsByName("dc_contributor_advisor_first_"+num)[0];
                    var advisorConfidenceIcon = $j(confidence).nextAll("img.ds-authority-confidence:first")[0];
                    ////console.log(advisorConfidenceIcon);
                    $j(span).attr("onclick","toggleAdvisorProxy("+num+");");
                    $j(span).before('<img class="advisor-toggle" name="dc_contributor_advisor_toggle_'+num+'" style="width: 8px; height: 8px; margin-right: 5px;" src="/static/icons/arrow-right.png" onclick="toggleAdvisor(this);" />');
                    $j(advisorConfidenceIcon).after('<div id="dc_contributor_advisor_status_'+num+'" style="display: none;"><p><img style="width: 16px; height: 16px;" src="/themes/dash/images/suggest-indicator.gif" />&nbsp;&nbsp;Searching...</p></div>');
                    $j(advisorConfidenceIcon).after('<button type="button" name="search_advisor_'+num+'" style="margin-left: 8px; margin-top: 8px; display: none;" onclick="doAdvisorRefresh(this);">Lookup</button>');
                    $j(advisorConfidenceIcon).after('<input type="hidden" name="dc_contributor_advisor_first_temp_'+num+'" value="'+first.value+'"/>');
                    $j(advisorConfidenceIcon).after('<br/><input type="hidden" style="margin-left: 18px;" name="dc_contributor_advisor_last_temp_'+num+'" value="'+last.value+'"/>');
                }
            } else {
                ////console.log("Can't find confidence element...");
            }
        });


    if (isDescribeStep) {

        // add pdf div
        loadDialogDiv();
        loadPdfDiv();
        loadSherpaDiv();
        loadDoiDiv();

        // resize abstract
        autosizeAbstract();

        // CHECK TITLE IF IT IS ALREADY POPULATED
        if ( typeof $j('#aspect_submission_StepTransformer_field_dc_title') === "undefined" ) {
            //console.log("no textarea found");
        } else {

            var ta = $j('#aspect_submission_StepTransformer_field_dc_title');
            ta.after('<div id="checkResults"></div>').trigger('create');
            var cookieTitle = readCookie("title");
            var isDifferentTitle = true;

            // TITLE AUTO-FILL BUTTON
            //$j('#aspect_submission_StepTransformer_field_dc_title').attr("class","test");
            $j('#aspect_submission_StepTransformer_field_dc_title').attr("style","width:85%;");

            ta.after("<button type='button' name='titleAutofillButton' style='display:inline; float:right; font-size: .75em;' onClick='titleAutofill();'>Autofill</button>" +
                "<button type='button' name='articleTitleCase' style='display:inline; float:right; font-size: .75em;' onClick='titleCase(\"article\");'>Title Case</button>");


            // JOURNAL TITLE CASE BUTTON
            var jt = $j('#aspect_submission_StepTransformer_field_dc_relation_journal');
            jt.after("<button type='button' name='articleTitleCase' style='display:inline; margin-left: 5px; font-size: .75em;' onClick='titleCase(\"journal\");'>Title Case</button>");

            if (/\/submit\//.test(window.location)) {
                //console.log("this is a submit page...");
            }
            //console.log("title val: " + ta.val());
            //console.log("cookie val: " + cookieTitle);

            if (cookieTitle != null && cookieTitle == ta.val()) {
                isDifferentTitle = false;
                //console.log("isn't different title");
            } else {
                isDifferentTitle = true;
                createCookie("title",ta.val(),1);
                //console.log("is different title");
            }

            // this runs on page load
            if (ta.val().length > 1 && isDifferentTitle) {

                $j('#checkResults').html("<p><img src='/themes/dash/images/suggest-indicator.gif' />&nbsp;&nbsp;Checking for duplicates...</p>");
                checkTitle(ta,itemid);
            }

            ta.blur(function() {

                cookieTitle = readCookie("title");
                //console.log("title val: " + ta.val());
                //console.log("cookie val: " + cookieTitle);
                if (cookieTitle != null && cookieTitle == ta.val()) {
                    isDifferentTitle = false;
                    //console.log("isn't different title");
                } else {
                    isDifferentTitle = true;
                    createCookie("title",ta.val(),1);
                    //console.log("is different title");
                }

                if (ta.val().length > 0 && isDifferentTitle) {

                    $j('#checkResults').html('');
                    var url = "/checktitle?itemid="+itemid+"&title=" + encodeURI(ta.val());

                    $j('#checkResults').html("<p><img src='/themes/dash/images/suggest-indicator.gif' />&nbsp;&nbsp;Checking for duplicates...</p>");

                    $j.ajax({
                        type: "GET",
                        url: url,
                        contentType: "text/html; charset=utf-8",
                        success: function(data) {
                            ////console.log(data);
                            if (/\S/.test(data)) {
                                ////console.log("data: --"+data+"--");
                                $j('#checkResults').html(data);
                                if (data.indexOf("No matching") == -1) {
                                    alert("Warning: Potential title duplicate(s) found! Please double-check that this item isn't a duplicate.");
                                }
                            } else {
                                $j('#checkResults').html('');
                            }
                        },
                        error: function(request, textStatus, errorThrown) {
                            //console.log("error: "+errorThrown); 
                        },
                        complete: function(request, textStatus){
                            //console.log('complete');  

                        }
                    });
                }


            });


            // add the button after the textarea dynamically
            var chkTitle = $j('<input/>',
                {
                    type: 'button',
                    value: 'Check title',
                    id: 'chkTitle',
                    click: function () {
                        var url = "/checktitle?title=" + encodeURI(ta.val());
                        //console.log("value: " + encodeURI(ta.val()) );
                        if (ta.val().length > 0) {
                            $j.ajax({
                                type: "GET",
                                url: url,
                                contentType: "text/html; charset=utf-8",
                                success: function(data) {
                                    //console.log(data);
                                    $j('#checkResults').html(data);
                                },
                                error: function(request, textStatus, errorThrown) {
                                    //console.log("error: "+errorThrown); 
                                },
                                complete: function(request, textStatus){
                                    //console.log('complete');

                                }
                            });
                        } else {
                            //console.log("no title to check...");
                        }
                        //return false;
                    }
                });
            //ta.after(chkTitle).trigger('create');
            //ta.after('<div id="checkResults"></div>').trigger('create');
        }


        // check abstract for hidden control characters
        var abstract = $j('#aspect_submission_StepTransformer_field_dc_description_abstract');
        abstract.blur(function() {
            // abstract.val(showHiddenCharacters(abstract));
            // just warn, don't replace text
            var hiddenChars = showHiddenCharacters(abstract);
        });


    } // END: isDescribeStep



});