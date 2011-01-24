// あらかじめデータを追加しておく
// 別府湾ロイヤルホテル
//   http://sika-map.appspot.com/post_location?lat=33.355993&lon=131.496761&user=kambara
//   http://sika-map.appspot.com/post_location?lat=33.355993&lon=131.496761&user=kambara&e_mail=kambara@sappari.org
// その他
//   http://sika-map.appspot.com/post_location?lat=33.362&lon=131.485&user=kambara
//   http://sika-map.appspot.com/post_location?lat=33.35&lon=131.49&user=kambara
//   http://sika-map.appspot.com/post_location?lat=33.45&lon=131.6&user=kambara
//   http://sika-map.appspot.com/post_location?lat=33.42&lon=131.52&user=kambara
//   http://sika-map.appspot.com/post_location?lat=33.424&lon=131.50&user=kambara
//   http://sika-map.appspot.com/post_location?lat=33.43&lon=131.52&user=kambara

var infoWindowList = [];
var locationList = [];

$(function() {
    var map = createMap();
    $.getJSON('/locations', function(locations) {
        //log(locations);
        locationList = locations;
        $.each(locations, function(index, loc) {
            setDeerMarker(map,
                          loc.latitude,
                          loc.longitude,
                          loc.time * 1000,
                          loc.name,
                          loc.has_image,
                          loc.id);
        });
    });
    setInterval(function() {
        checkRecentLocations(map);
    }, 5000);
});

function checkRecentLocations(map) {
    if (locationList.length == 0) return;
    var last = locationList[locationList.length - 1];
    //console.log(last.time);
    var url = '/locations?prev=' + last.time;
    $.getJSON(url, function(locations) {
        // setTimeout(function() {
        //     checkRecentLocations(map);
        // }, 5000);
        if (locations == 0) return;
        showAlert();
        
        $.each(locations, function(index, loc) {
            locationList.push(loc);
            
            setDeerMarker(map,
                          loc.latitude,
                          loc.longitude,
                          loc.time * 1000,
                          loc.name,
                          loc.has_image,
                          loc.id);
            map.panTo(new google.maps.LatLng(loc.latitude, loc.longitude));
        });
    });
}

function createMap(pos) {
    var lat = pos ? pos.coords.latitude : 33.355993;
    var lng = pos ? pos.coords.longitude: 131.496761;
    var latlng = new google.maps.LatLng(lat, lng);
    var myOptions = {
        zoom: 15,
        center: latlng,
        scaleControl: true,
        mapTypeId: google.maps.MapTypeId.HYBRID
        //mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    var map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
    google.maps.event.addListener(map, 'click', function() {
        closeInfoWindows();
        hideAlert();
    });
    return map;
}

function showAlert() {
    $('#deer-alert').fadeIn('fast', function() {
        setTimeout(function() {
            hideAlert();
        }, 10000);
    });
}

function hideAlert() {
    $('#deer-alert').fadeOut();
}

function setDeerMarker(map, lat, lng, time, name, hasImage, id) {
    //log(name);

    

    var marker = new google.maps.Marker({
        position: new google.maps.LatLng(lat, lng),
        title: "鹿！",
        icon: "images/deer-icon.png",
        map: map
    });
    google.maps.event.addListener(marker, 'click', function() {
        closeInfoWindows();
        var date = new Date(time);
        var timeStr = [[date.getFullYear(),
                        date.getMonth() + 1,
                        date.getDate(),
                       ].join('/'),
                       [date.getHours(),
                        date.getMinutes(),
                        date.getSeconds()
                       ].join(':')
                      ].join(' ');
        var randImage = ['/images/deer',
                         Math.ceil(Math.random() * 3).toString(),
                         '.jpg'
                        ].join('');
        var imgUrl = hasImage ? '/image?id='+id : randImage;
        var infoWindow = new google.maps.InfoWindow({
            content: [
                '<a target="_blank" href="' + imgUrl + '">',
                '<img style="min-height: 150px;" width="300px" src="',
                imgUrl,
                '" />',
                '</a>',
                '<div style="font-weight:bold; margin-top: 0.3em;">',
                name,
                '</div>',
                '<div style="font-size: 80%;">',
                timeStr,
                '</div>'
                
            ].join('')
        });
        infoWindowList.push(infoWindow);
        infoWindow.open(map, marker);
    });
}

function closeInfoWindows() {
    $.each(infoWindowList, function(index, infoWindow) {
        infoWindow.close();
    });
}

function log(obj) {
    if (window.console) {
        console.log(obj);
    }
}