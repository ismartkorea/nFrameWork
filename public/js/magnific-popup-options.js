$(document).ready(function() {
    // 	var magnifPopup = function()
    /*
     var magnifPopup = function() {
     $('.image-popup').magnificPopup({
     type: 'image',
     removalDelay: 300,
     mainClass: 'mfp-with-zoom',
     gallery:{
     enabled:true
     },
     zoom: {
     enabled: true, // By default it's false, so don't forget to enable it

     duration: 300, // duration of the effect, in milliseconds
     easing: 'ease-in-out', // CSS transition easing function

     // The "opener" function should return the element from which popup will be zoomed in
     // and to which popup will be scaled down
     // By defailt it looks for an image tag:
     opener: function(openerElement) {
     // openerElement is the element on which popup was initialized, in this case its <a> tag
     // you don't need to add "opener" option if this code matches your needs, it's defailt one.
     return openerElement.is('img') ? openerElement : openerElement.find('img');
     }
     }
     });
     };
     */
    var magnifPopup = function() {
        $('.open-popup-link').magnificPopup({
            type: 'iframe',
            midClick: true,
            // allow opening popup on middle mouse click. Always set it to true if you don't provide alternative source.
            iframe: {
                markup: '<div class="mfp-iframe-scaler2">' +
                '<div class="mfp-close"></div>' +
                '<iframe class="mfp-iframe" frameborder="0" allowfullscreen></iframe>' +
                '</div>'
            }
        });
    };


    /*
     높이가 다른 프레임 팝업 추가 시 아래처럼 .open-popup을 다른 이름으로 수정하고 팝업시킬 페이지 넣고
     클래스 새로 추가하면 됨(magnific-popup.css에서 mfp-iframe-scaler3 이름을 딴걸로 복제하여 클래스 추가 해서 height 수정하면 됨
     */


    /* 아이디/비밀번호 찾기 popup */
    $(document).ready(function() {
        $('.open-popup').magnificPopup({
            items: {src: '/login/findId'},
            type: 'iframe',
            iframe: {
                markup: '<div class="mfp-iframe-scaler3">'+
                '<iframe class="mfp-iframe" frameborder="0"  allowtransparency="true" allowfullscreen></iframe>'+
                '<div class="mfp-close"></div>'+
                '</div>'
            },
        });
    });


    var magnifVideo = function() {
        $('.popup-youtube, .popup-vimeo, .popup-gmaps').magnificPopup({
            disableOn: 700,
            type: 'iframe',
            mainClass: 'mfp-fade',
            removalDelay: 160,
            preloader: false,

            fixedContentPos: false
        });
    };


    // Call the functions
    magnifPopup();
    magnifVideo();


});







