// Scale fixed mobile header
// from https://signalvnoise.com/posts/2407-device-scale-user-interface-elements-in-ios-mobile-safari
function getDeviceScale() {
    var deviceWidth, landscape = Math.abs(window.orientation) == 90;
    if (landscape) {
      // iPhone OS < 3.2 reports a screen height of 396px
      deviceWidth = Math.max(640, screen.height);
    } else {
      deviceWidth = screen.width;
    }
    return window.innerWidth / deviceWidth;
}
// mobile only - keep the position:fixed header at constant size when page is zoomed
if (navigator.userAgent.match(/Mobi/)) {
    $(window).on('load scroll', function() {
        var ds = getDeviceScale();
        $('.device-fixed-height').css('transform','scale(1,' + ds + ')')
            .css('transform-origin', '0 0');
        $('.device-fixed-width').css('transform', 'scale(' + ds + ',1)')
            .css('transform-origin', '0 0');
        })
}
window.onorientationchange = function()
{
   window.location.reload();
}
