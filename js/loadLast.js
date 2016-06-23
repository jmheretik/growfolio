$(window).on('load', function () {
    $(window).resize();
});

$(window).on('resize', function () {
    
    // to recompute fixed navs    
    $(window).scroll();
});