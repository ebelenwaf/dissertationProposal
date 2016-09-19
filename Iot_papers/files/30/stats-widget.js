(function() {

    // scoped jquery
    var jq;
    var host = "https://dash.harvard.edu";

    // insert widget div after this script
    var widget_div = document.createElement('div');
    widget_div.setAttribute("id","stats-widget-container");
    widget_div.setAttribute("scoped","scoped");
    widget_div.innerHTML = "<table>" +
        "<thead><th style='text-align:left;'>Last 7 Days</th><th style='text-align:left;'>Last 30 Days</th><th style='text-align:left;'>All Time</th><th style='text-align:left;width: 50px;'>Trend</th></thead>" +
        "<tbody><tr>" +
        "<td><span id='last7'></span></td>" +
        "<td><span id='last30'></span></td>" +
        "<td><span id='alltime'></span></td>" +
        "<td><span id='sparkline'></span></td>" +
        "</tr></tbody>" +
        "</table>";

    var current_script = document.getElementById("stats-widget");
    current_script.parentNode.insertBefore(widget_div, current_script.nextSibling);
    var queryString = current_script.src.replace(/^[^\?]+\??/,'');
    var params = parseQuery(queryString);

    /******** load jQuery *********/
    if (window.jQuery === undefined || window.jQuery.version !== '1.4.3') {

        var script_tag = document.createElement('script');
        script_tag.setAttribute("type","text/javascript");
        script_tag.setAttribute("src", "https://cdnjs.cloudflare.com/ajax/libs/jquery/1.4.3/jquery.min.js");
        if (script_tag.readyState) {
            script_tag.onreadystatechange = function () { // For old versions of IE
                if (this.readyState == 'complete' || this.readyState == 'loaded') {
                    scriptLoadHandler();
                }
            };
        } else {
            script_tag.onload = scriptLoadHandler;
        }
        current_script.parentNode.insertBefore(script_tag, current_script.nextSibling);

    } else {
        scriptLoadHandler();
    }

    function parseQuery ( query ) {
        var Params = new Object ();
        if ( ! query ) return Params; // return empty object
        var Pairs = query.split(/[;&]/);
        for ( var i = 0; i < Pairs.length; i++ ) {
            var KeyVal = Pairs[i].split('=');
            if ( ! KeyVal || KeyVal.length != 2 ) continue;
            var key = unescape( KeyVal[0] );
            var val = unescape( KeyVal[1] );
            val = val.replace(/\+/g, ' ');
            Params[key] = val;
        }
        return Params;
    }

    function numberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    /******** load sparkline library once jquery is done loading ******/
    function scriptLoadHandler() {

        // load scoped jquery.sparkline
        var scoped_sparkline = document.createElement('script');
        scoped_sparkline.setAttribute("type","text/javascript");
        scoped_sparkline.setAttribute("src", "https://cdnjs.cloudflare.com/ajax/libs/jquery-sparklines/2.1.2/jquery.sparkline.min.js");
        if (scoped_sparkline.readyState) {
            scoped_sparkline.onreadystatechange = function () {
                if (this.readyState == 'complete' || this.readyState == 'loaded') {
                    getData();
                }
            };
        } else {
            scoped_sparkline.onload = getData;
        }
        current_script.parentNode.insertBefore(scoped_sparkline, current_script.nextSibling);

    }

    /******** fetch the stats data ********/
    function getData() {

        jq = jQuery.noConflict(true);

        jq.ajax({
            type: "GET",
            url: host + "/stats?handle=" + params['handle'],
            dataType: "json",
            beforeSend: function() { },
            success: function(stats) {
                jq("#sparkline").sparkline(stats.data.trend, {type: 'line'});
                jq("#last7").text(numberWithCommas(stats.data.last7));
                jq("#last30").text(numberWithCommas(stats.data.last30));
                jq("#alltime").text(numberWithCommas(stats.data.alltime));
            },
            error: function(request, textStatus, errorThrown) {
                // hide the table row now
                jq("#stats").hide();
            },
            complete: function(request, textStatus){
            }
        });
    }

})();