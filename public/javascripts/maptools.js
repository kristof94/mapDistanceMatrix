var map;
var markers = [];
var inputs = [];

function addAdress(adress) {
  var element = inputs
    .filter(input => $("#" + input.id).val() == "")
    .map(input => $("#" + input.id))[0];
  if (element) {
    element.val(adress);
  }
}

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 48.866667, lng: 2.333333 },
    zoom: 13
  });
  coll = document.getElementsByTagName("input");
  for (var i = 0; i < coll.length; i++) inputs.push(coll[i]);
  inputs
    .filter(input => input.id.startsWith("adress") && !input.id.endsWith("0"))
    .forEach(element => {
      $("#" + element.id).val("");
      iniatializeAutocomplete(element);
    });
  map.addListener("click", function(e) {
    placeMarkerAndPanTo(e.latLng, map);
  });
  geocoder = new google.maps.Geocoder();
}

function placeMarkerAndPanTo(latLng, map) {
  if (markers.length >= 10) {
    return;
  }
  geocoder.geocode({ location: latLng }, function(results, status) {
    if (status === "OK") {
      if (results[0]) {
        var marker = new google.maps.Marker({
          position: latLng,
          map: map
        });
        if (markers.length === 0) {
          marker.setIcon(
            "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
          );
        }
        markers.push(marker);
        map.panTo(latLng);
        var adress = results[0].formatted_address;
        addAdress(adress);
      } else {
        window.alert("No results found");
      }
    } else {
      window.alert("Geocoder failed due to: " + status);
    }
  });
}

function clearMap() {
  markers.forEach(marker => {
    marker.setMap(null);
    marker = null;
  });
  markers = [];
  inputs.forEach(element => {
    $("#" + element.id).val("");
    $("#" + element.id).removeClass("colorize");
  });
}

function iniatializeAutocomplete(idInput) {
  const autocomplete = new google.maps.places.Autocomplete(idInput);
  google.maps.event.addListener(autocomplete, "place_changed", function() {
    var place = this.getPlace();
    const location = place.geometry.location;
    var marker = new google.maps.Marker({
      position: location,
      map: map,
      title: "Hello World!"
    });
    markers.push(marker);
  });
}

function compute() {
  var origins = markers.slice(0, 1).map(marker => {
    return {
      lat: marker.getPosition().lat(),
      lng: marker.getPosition().lng()
    };
  });
  var destinations = markers.slice(1).map(marker => {
    return {
      lat: marker.getPosition().lat(),
      lng: marker.getPosition().lng()
    };
  });
  var service = new google.maps.DistanceMatrixService();
  service.getDistanceMatrix(
    {
      origins: origins,
      destinations: destinations,
      travelMode: $("#travelOptions").val(),
      drivingOptions: {
        departureTime: new Date(Date.now()), // for the time N milliseconds from now.
        trafficModel: "optimistic"
      }
    },
    findClosest
  );
}

function findClosest(response, status) {
  var index = 0;
  var duration_ = -1;
  var distance_ = -1;
  if (status == "OK") {
    var origins = response.originAddresses;
    var destinations = response.destinationAddresses;
    for (var i = 0; i < origins.length; i++) {
      var results = response.rows[i].elements;
      for (var j = 0; j < results.length; j++) {
        var element = results[j];
        var distance = element.distance.value;
        var duration = element.duration.value;
        var from = origins[i];
        var to = destinations[j];
        console.log(from + " to " + to);
        console.log("distance : " + distance + "; duration : " + duration);
        if (
          (distance_ === -1 && duration_ === -1) ||
          (distance < distance_ && duration < duration_)
        ) {
          distance_ = distance;
          duration_ = duration;
          index = j;
        }
      }
    }
    markers[index + 1].setIcon(
      "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
    );
    $("#adress" + (index + 1)).addClass("colorize");
  }
}
