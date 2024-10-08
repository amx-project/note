var ID = 0;
const API_URL = "https://chosashi-data.org/amx/sticky_note_map/api/";

var data_Lng = "";
var data_Lat = "";
var ZoomLv = "";
var user = "";
var Lng = "";
var Lat = "";
var data = "";
let map = "";
var Popup_Layers_Name = "";
var Latest_ID = 0;
var Get_ID = 0;
var DoubleClick_Flg = false;
var Limit21_PopUp01 = new maplibregl.Popup()
var PopupFlg = false;

const Flyto_Point = (data_Lng, data_Lat, ZoomLv) => {
  map.flyTo({
    center: [data_Lng, data_Lat],
    zoom: ZoomLv,
    speed: 2.5,
    curve: 1
  })
  const screenWidth = window.innerWidth;
  setTimeout(function() {
    if (screenWidth < 700) {
      const detailsElement = document.getElementById('newContents');
      detailsElement.open = false;
    }
  }, 500)
}

const numberWithCommas = (x) => x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")

var Update_Access_Count = fetch(API_URL, {
  method: 'POST',
  headers: {'Content-Type': 'application/x-www-form-urlencoded' },
  body: 'key=' + encodeURIComponent('update_Access_Count')
});

(async () => {
  try {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'key=' + encodeURIComponent('get_Access_Count')
      })
      .then(response => response.text())
      .then(text => {
        var trimmedText = text.trim();
        var data = JSON.parse(trimmedText);
        var count = data[0].Count;
        document.getElementById('Count').textContent = numberWithCommas(count) + ' PV';
      })
  } catch (error) {
    console.error('Error fetching data:', error);
  }
})();

async function Update_ShareInfo() {
  try {
    await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'key=' + encodeURIComponent('confirm_ID')
      })
      .then(response => response.text())
      .then(text => {
        var trimmedText = text.trim();
        var data = JSON.parse(trimmedText);
        Get_ID = data[0].ID;
        if (Latest_ID != Get_ID) {
          getShareInfo();
        } else {
          console.log("投稿更新しない");
        }
      })
  } catch (error) {
    console.error("サーバーエラー", error);
  }
}

function delete_Share_Info(ID) {
  if (confirm('本当に削除しますか？')) {
    fetch(API_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'key=' + encodeURIComponent('delete_Sticky_Note') + '&ID=' + encodeURIComponent(ID)
    })
    Limit21_PopUp01.remove();
    getShareInfo();
  }
}

function getShareInfo() {
  if (map.getSource('Limit12_Share_Info')) {
    map.removeLayer('Limit12_Share_Info')
    map.removeLayer('Limit12_Share_Info_Label')
    map.removeLayer('Limit12_Share_Info_Cluster')
    map.removeLayer('Limit12_Share_Info_Cluster_Label')
    map.removeSource('Limit12_Share_Info');
  }
  setTimeout(function() {
    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'key=' + encodeURIComponent('get_Sticky_Note')
      })
      .then(response => response.text())
      .then(text => {
        var trimmedText = text.trim();
        var data = JSON.parse(trimmedText);
        disp_point_limit12(data);
      }),
      fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'key=' + encodeURIComponent('get_Sticky_Note_List')
      })
      .then(response => response.text())
      .then(text => {
        var trimmedText = text.trim();
        var data = JSON.parse(trimmedText);
        const tableBody = document.getElementById('infoTable').querySelector('tbody');
        tableBody.innerHTML = ''; 
        data.forEach(row => {
          const newRow = document.createElement('tr');
          const truncatedInfo = row.Info.length > 30 ? row.Info.substring(0, 30) + '...' : row.Info;
          newRow.innerHTML = `
					<td class="yubi" onclick="Flyto_Point('${row.Lng}', '${row.Lat}',17)">${truncatedInfo}<br><small>(ID:${row.ID}) ${row.PostDateTime}<small></td>
				`;
          tableBody.appendChild(newRow);
        });
      })
  }, 500);
}

var share_info_features = [];
function disp_point_limit12(data) {
  share_info_features = [];
  var latlng;
  var description;
  var ilen = data.length;

  for (var i = 0; i < ilen; i++) {
    var feature = [];
    var point = [];
    point = {
      type: 'Feature',
      properties: {
        ID: data[i].ID,
        User: data[i].User,
        Share_Info: data[i].Info,
        URL: data[i].URL,
        Share_Info_Label: data[i].Info.length > 30 ? data[i].Info.substring(0, 30) + '...' : data[i].Info,
        NiceCount: data[i].NiceCount,
        PostDateTime: data[i].PostDateTime,
        TermDateTime: data[i].TermDateTime,
        MaxTermDateTime: data[i].MaxTermDateTime
      },
      geometry: {
        type: 'Point',
        coordinates: [data[i].Lng, data[i].Lat]
      }
    };
    share_info_features.push(point);
    Latest_ID = data[i].ID;
  }
  var geojson = {
    type: "FeatureCollection",
    features: share_info_features
  };
  map.addSource("Limit12_Share_Info", {
    type: "geojson", data: geojson, cluster: true, clusterMaxZoom: 12,
  });

  map.addLayer({
    id: 'Limit12_Share_Info_Cluster', type: 'circle', source: 'Limit12_Share_Info',
    layout: {},
    paint: {
      'circle-radius': 20.0, 
      'circle-color': 'rgba(0, 0, 255, 0.5)',
      'circle-stroke-color': 'rgba(255,255,255,0.5)',
      'circle-stroke-width': 2.0,
      'circle-opacity': 1.0,
    },
    minzoom: 0, maxzoom: 14
  });

  map.addLayer({
    id: 'Limit12_Share_Info_Cluster_Label', type: 'symbol', source: 'Limit12_Share_Info',
    layout: {
      "text-field": ["get", "point_count_abbreviated"],
      "text-font": ["NotoSansJP-Regular"],
    },
    paint: {
      'text-color': 'rgba(0, 0, 255, 1)',
      'text-halo-color': 'rgba(255,255,255,1)',
      'text-halo-width': 2.0,
    },
    minzoom: 0, maxzoom: 14
  });

  map.addLayer({
    id: 'Limit12_Share_Info', type: 'circle', source: 'Limit12_Share_Info',
    layout: {},
    paint: {
      'circle-radius': 3.5, 
      'circle-color': 'rgba(0, 0, 255, 1)',
      'circle-stroke-color': 'rgba(255,255,255,1)',
      "circle-stroke-width": ["step", ["zoom"],
        0.0, 4,
        0.2, 13,
        2.0
      ],
      'circle-opacity': 1.0,
    },
    minzoom: 14, maxzoom: 24
  });

  map.addLayer({
    id: 'Limit12_Share_Info_Label', type: 'symbol',
    source: 'Limit12_Share_Info',
    layout: {
      'text-field': ['get', 'Share_Info_Label'],
      "text-font": ["NotoSansJP-Regular"],
      'text-anchor': 'left',
      'text-offset': [0.5, 0],
    },
    paint: {
      'text-color': 'rgba(0, 0, 255, 1)',
      'text-halo-color': 'rgba(255,255,255,1)',
      'text-halo-width': 2.0,
    },
    minzoom: 14, maxzoom: 24
  })
}

function getLocation(getLatLng) {
	map.flyTo({
	  center: [getLatLng.coords.longitude, getLatLng.coords.latitude],
	  zoom: 17, speed: 2.5, curve: 1
	});
}
setInterval(Update_ShareInfo, 1000 * 60);

var popup_contextmenu = new maplibregl.Popup();
var LongTouch_Flg = false;
var db_user = "";
var db_Lng = "";
var db_Lat = "";
var db_share_info = "test";
var db_POST_Lng = "";
var db_POST_Lat = "";

function add_share_info() {
  db_share_info = document.getElementById("db_share_info").value;
  db_share_info_URL = document.getElementById("db_share_info_URL").value;
  if (db_share_info !== "" || db_share_info_URL !== "") {
    popup_contextmenu.remove();
    if (db_share_info === "") {
      db_share_info = db_share_info_URL;
    }
    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'key=' + encodeURIComponent('add_Sticky_Note') + '&db_user=' + db_user + '&db_share_info=' + db_share_info + '&db_share_info_URL=' + db_share_info_URL + '&db_Lng=' + db_Lng + '&db_Lat=' + db_Lat
      })
      .then(getShareInfo())
  } else {
    alert("コメントが入力されていません。");
  }
}

function PopUp_Context_Menu(e) {
  ZoomLv = map.getZoom();
  db_user = "guest";
  db_Lng = e.lngLat.lng;
  db_Lat = e.lngLat.lat;
  popup_contextmenu.remove();
  Limit21_PopUp01.remove();
  popup_contextmenu = new maplibregl.Popup({
      closeButton: false
    })
    .setLngLat(e.lngLat)
    .setHTML(
      '<div id="contextmenu" style="width: 250px;">' +
      "<b>Post (within 100 characters)</b><br>" +
      "<input type='hidden' name='db_user' value='" + db_user + "'>" +
      "<input type='hidden' name='db_Lng' value='" + db_Lng + "'>" +
      "<input type='hidden' name='db_Lat' value='" + db_Lat + "'>" +
      "<input  type='text'class='share_info' id='db_share_info' name='db_share_info' placeholder='comment/URL' maxlength='100'> " + " " +
      "<button id='share_info_Button' class='sendButton' onclick='add_share_info()'><b>POST</b></button><br>" +
      "<small>リンク </small><input  type='text'class='share_info' id='db_share_info_URL' name='db_share_info_URL' placeholder='URL'  maxlength='100'> " + "<br>" +
      "<hr>" +
      "<a href='https://www.google.co.jp/maps?q=" + e.lngLat.lat + "," + e.lngLat.lng + "&hl=ja' target='_blank'>Google Maps</a> / " +
      "<a href='https://www.google.com/maps/@?api=1&map_action=pano&parameters&viewpoint=" + e.lngLat.lat + ",%20" + e.lngLat.lng + "' target='_blank'>Google Street View</a><br>" +
      '</div>'
    );
  popup_contextmenu.addTo(map);
  const textBox = document.getElementById('db_share_info');
  textBox.focus();
}

function update_PopupCount(e) {
  var ID = e.features[0].properties['ID'];
  fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'key=' + encodeURIComponent('update_PopupCount') + '&ID=' + encodeURIComponent(ID)
  })
  for (var i = 0; i < share_info_features.length; i++) {
    if (share_info_features[i].properties.ID === ID) {
      var TermDateTime = new Date(share_info_features[i].properties.TermDateTime);
      TermDateTime.setMinutes(TermDateTime.getMinutes() + 12);
      share_info_features[i].properties.TermDateTime = TermDateTime.toISOString();
    }
  }
  var geojson = {
    type: "FeatureCollection",
    features: share_info_features
  };
  map.getSource('Limit12_Share_Info').setData(geojson);
};

function update_NiceCount(ID) {
  fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'key=' + encodeURIComponent('update_NiceCount') + '&ID=' + encodeURIComponent(ID)
  })
  const NiceCountElement = document.getElementById("NiceCount");
  let CurrentNiceCount = parseInt(NiceCountElement.textContent);
  CurrentNiceCount++;
  NiceCountElement.textContent = CurrentNiceCount;
};

function MilliToTime(MilliSeconds) {
  const Seconds = Math.floor(MilliSeconds / 1000);
  const Minutes = Math.floor(Seconds / 60);
  const Hours = Math.floor(Minutes / 60);
  const RemainingMinutes = Minutes % 60;
  const RemainingSeconds = Seconds % 60;
  return `${Hours} h ${RemainingMinutes} m`;
}

function Popup_Limit12(e) {
  PopupFlg = false;

  var ID = e.features[0].properties['ID'];
  var Popup_Limit12_User = e.features[0].properties['User'];
  var Popup_Limit12_Info = e.features[0].properties['Share_Info'];
  var Popup_Limit12_URL = e.features[0].properties['URL'];
  var Popup_Limit12_Lng = e.features[0].geometry.coordinates[0];
  var Popup_Limit12_Lat = e.features[0].geometry.coordinates[1];
  var Popup_Limit12_PostDateTime = e.features[0].properties['PostDateTime'];
  var Popup_Limit12_TermDateTime = e.features[0].properties['TermDateTime'];
  var Popup_Limit12_MaxTermDateTime = e.features[0].properties['MaxTermDateTime'];
  var Popup_Limit12_NiceCount = e.features[0].properties['NiceCount'];
  var TermDateTime = new Date(Popup_Limit12_TermDateTime);
  var now = new Date();
  var MilliSeconds = TermDateTime - now;
  var RemainingTime = MilliToTime(MilliSeconds)
  ZoomLv = map.getZoom();
  update_PopupCount(e);

  let infoContent = Popup_Limit12_Info;
  if (Popup_Limit12_URL !== " ") {
    infoContent = `<a href="${Popup_Limit12_URL}" target="_blank">${Popup_Limit12_Info}</a>`;
  } else {
    if (Popup_Limit12_Info.startsWith("https://")) {
      infoContent = `<a href="${Popup_Limit12_Info}" target="_blank">${Popup_Limit12_Info}</a>`;
    }
  }

  Limit21_PopUp01.remove();
  Limit21_PopUp01 = new maplibregl.Popup()
    .setLngLat(e.lngLat)
    .setHTML(
      '<span><b>' + '<big>' + infoContent + '</big>' + '</b></span>' + '<br>' +
      '</span></b><span><b>' + 'from ' + Popup_Limit12_User + '</b></span>' + '<br>' +
      '<span> at </span><span id = "PostDateTime">' + Popup_Limit12_PostDateTime + '</span><span> </span>' +
      '<button id="delete_share_info_Button" class="sendButton" onclick="delete_Share_Info(' + ID + ')"><b>Delete</b></button>' + '<br>' +
      '<span  class="nice" id = "NiceButton"><b>' + 'Like </b></span><b><span>（</span><span id = "NiceCount">' + Popup_Limit12_NiceCount + '</span><span>）</span></b>' +
      '<span><span id = "RemainingTime">' + RemainingTime + '</span> left<br>' +
      '<hr>' +
      "<a href='https://www.google.co.jp/maps?q=" + Popup_Limit12_Lat + "," + Popup_Limit12_Lng + "&hl=ja' target='_blank'>Google Maps</a> / " +
      "<a href='https://www.google.com/maps/@?api=1&map_action=pano&parameters&viewpoint=" + Popup_Limit12_Lat + ",%20" + Popup_Limit12_Lng + "' target='_blank'>Google Street View</a><br>"
    ).addTo(map);

  document.getElementById("NiceButton").addEventListener("click", function() {
    if (!PopupFlg) {
      update_NiceCount(ID);
      PopupFlg = true;
      var TermDateTime = new Date(Popup_Limit12_TermDateTime);
      var MaxTermDateTime = new Date(Popup_Limit12_MaxTermDateTime);
      TermDateTime.setHours(TermDateTime.getHours() + 1);
      if (MaxTermDateTime > TermDateTime) {
        var now = new Date();
        var MilliSeconds = TermDateTime - now;
        var RemainingTime = MilliToTime(MilliSeconds);
        document.getElementById("RemainingTime").textContent = RemainingTime;
        for (var i = 0; i < share_info_features.length; i++) {
          if (share_info_features[i].properties.ID === ID) {
            share_info_features[i].properties.NiceCount = parseInt(share_info_features[i].properties.NiceCount) + 1;
            var TermDateTime = new Date(share_info_features[i].properties.TermDateTime);
            TermDateTime.setHours(TermDateTime.getHours() + 1);
            share_info_features[i].properties.TermDateTime = TermDateTime.toISOString();
          }
        }
        var geojson = {
          type: "FeatureCollection",
          features: share_info_features
        };
        map.getSource('Limit12_Share_Info').setData(geojson);
      }
    }
  });
};

const geocoderApi = {
	forwardGeocode: async (config) => {
	  const features = [];
	  try {
		const request =
		  `https://nominatim.openstreetmap.org/search?q=${
				  config.query
			  }&format=geojson&polygon_geojson=1&addressdetails=1`;
		const response = await fetch(request);
		const geojson = await response.json();
		for (const feature of geojson.features) {
		  const center = [
			feature.bbox[0] +
			(feature.bbox[2] - feature.bbox[0]) / 2,
			feature.bbox[1] +
			(feature.bbox[3] - feature.bbox[1]) / 2
		  ];
		  const point = {
			type: 'Feature',
			geometry: {
			  type: 'Point',
			  coordinates: center
			},
			place_name: feature.properties.display_name,
			properties: feature.properties,
			text: feature.properties.display_name,
			place_type: ['place'],
			center
		  };
		  features.push(point);
		}
	  } catch (e) {
		console.error(`Failed to forwardGeocode with error: ${e}`);
	  }
  
	  return {
		features
	  };
	}
};

(async () => {
  let style = await fetch('terrain22.json').then(resp => resp.json())
  maplibregl.addProtocol("pmtiles", (new pmtiles.Protocol()).tile);

  map = new maplibregl.Map({
    container: 'map',
    hash: true,
    style: style,
    center: [139.75417, 36.50],
    zoom: 1,
    minZoom: 1,
    maxZoom: 23,
  })

  map.on('load', function() {
    ZoomLv = map.getZoom();
    if (ZoomLv == 1) {
      setTimeout(
        function() {
          navigator.geolocation.getCurrentPosition(getLocation);
        }, 1000
      );
    }
    getShareInfo();
    const detailsElement = document.getElementById('newContents');
    detailsElement.addEventListener('toggle', () => {
      if (detailsElement.open) {
        Update_ShareInfo();
      }
    });
  });
  map.doubleClickZoom.disable();

  map.addControl(new MaplibreGeocoder(geocoderApi, { maplibregl }))
  map.addControl(new maplibregl.FullscreenControl())
  map.addControl(new maplibregl.NavigationControl())
  map.addControl(new maplibregl.TerrainControl({ source: "gel-raster-dem" }))
  map.addControl(new maplibregl.ScaleControl({ unit: "metric" }))
  map.addControl(new maplibregl.GeolocateControl())

  map.on('click', 'Limit12_Share_Info', (e) => { Popup_Limit12(e) })
  map.on('click', 'Limit12_Share_Info_Label', (e) => { Popup_Limit12(e) })
  map.on('click', 'Limit12_Share_Info_Cluster', (e) => {
    const screenWidth = window.innerWidth;
    if (screenWidth < 700) { ZoomLv = map.getZoom() + 3 } else { ZoomLv = map.getZoom() + 4 }
    data_Lng = e.features[0].geometry.coordinates[0];
    data_Lat = e.features[0].geometry.coordinates[1];
    Flyto_Point(data_Lng, data_Lat, ZoomLv);
  })
  map.on('click', function(e) {
    popup_contextmenu.remove();
    if (DoubleClick_Flg) {
      PopUp_Context_Menu(e);
      DoubleClick_Flg = false;
    } else {
      DoubleClick_Flg = true;
      setTimeout(() => {
        DoubleClick_Flg = false;
      }, 300);
    }
  });
  map.on('mousemove', 'Limit12_Share_Info', (e) => {
    map.getCanvas().style.cursor = 'pointer'
  });
  map.on('mousemove', 'Limit12_Share_Info_Label', (e) => {
    map.getCanvas().style.cursor = 'pointer'
  });
  map.on('mouseleave', 'Limit12_Share_Info', function() {
    map.getCanvas().style.cursor = '';
  });
  map.on('mouseleave', 'Limit12_Share_Info_Label', function() {
    map.getCanvas().style.cursor = '';
  });
  map.on('mousemove', 'Limit12_Share_Info_Cluster', (e) => {
    map.getCanvas().style.cursor = 'pointer'
  });
  map.on('mouseleave', 'Limit12_Share_Info_Cluster', function() { map.getCanvas().style.cursor = '' })
  map.on('drag', function() { map.getCanvas().style.cursor = 'grabbing'; })
  map.on('moveend', function() { map.getCanvas().style.cursor = ''; })
  map.on('movestart', function() { })
})()