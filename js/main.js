
document.addEventListener("DOMContentLoaded", init);

// function reports window size, used to resize when window extent changes
function reportWindowSize() {
  var elem = document.querySelector('html');
  elem.style.fontSize = `${window.innerWidth/75}px`;
}



function init() {

// Reset selector dropdowns on page reload
  $(window).on("pageshow", function() {
      for (selector of ['#layer_selector', '#originLeftSelector', '#originRightSelector']){
        $(selector).prop('selectedIndex', function () {
            var selected = $(this).children('[selected]').index();
            return selected != -1 ? selected : 0;
        });
      }
  });

  reportWindowSize();

  window.onresize = reportWindowSize; //runs function each time window resizes

  const map = L.map('map', {
    zoomControl: false,
    doubleClickZoom: false,
    maxBoundsViscosity: 1.0
  }).setView([40.50, -73.025], 10);

  const bounds = L.latLngBounds([41.394543, -70.684156], [40.370698, -75.346929]);

  map.setMaxBounds(bounds);

  map.setMinZoom(8);

  map.setMaxZoom(15);

  //L.doubleClickZoom(false);

  L.tileLayer('http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {

  }).addTo(map);

  L.control.scale().addTo(map);


//  As far as I know we need two clients for the slider to work; but paul you should look into this? - CV 12/13/2019
  const clientLeft = new carto.Client({
    apiKey: "6835ac33fdea1831afbabcc40bb7e09468c6945a",
    username: "latinos",
    serverUrl: "http://app2.gss.stonybrook.edu/user/latinos"
  });

  const clientRight = new carto.Client({
    apiKey: "6835ac33fdea1831afbabcc40bb7e09468c6945a",
    username: "latinos",
    serverUrl: "http://app2.gss.stonybrook.edu/user/latinos"
  });

  latinoOrigins = [{
      variableID: "v01001",
      alias: "pop_pr",
      origin: "'Puerto-Rican'"
    },
    {
      variableID: "v01002",
      alias: "pop_mex",
      origin: "'Mexican'"
    },
    {
      variableID: "v01003",
      alias: "pop_cub",
      origin: "'Cuban'"
    },
    {
      variableID: "v01004",
      alias: "pop_other",
      origin: "'Other'"
    },
    {
      variableID: "v01005",
      alias: "pop_dom",
      origin: "'Dominican'"
    },
    {
      variableID: "v01006",
      alias: "pop_ca",
      origin: "'Central American'"
    },
    {
      variableID: "v01007",
      alias: "pop_sa",
      origin: "'South American'"
    }
  ]



  function createQuery(year, varList){
    varArgs = Array.prototype.slice.call(varList) // cast the variable arguments to a list again for use with list methods
    let caseBlocks = Object.keys(latinoOrigins).map((originKey) => {
      domOrigin =latinoOrigins[originKey].variableID
      origin = latinoOrigins[originKey].origin
      return [`WHEN greatest(${varArgs.join(",")}) = t.${domOrigin} THEN round(t.${domOrigin} ::numeric / t.v00002::numeric, 2)`,
        `WHEN greatest(${varArgs.join()}) = t.${domOrigin} THEN ${origin} `]
    });

    let dominanceQuery = `
    SELECT g.cartodb_id, g.gisjoin, g.the_geom, g.the_geom_webmercator, t.year,
    t.areaname, t.v00001::numeric as total_pop, v00002::numeric as latino_pop,
    ${varArgs.join("::numeric,")}::numeric,
    CASE
    ${caseBlocks.map(item=>item[0]).join("\n")}
    END as relative_dom,
    CASE
    ${caseBlocks.map(item=>item[1]).join("\n")}
    END as dominant_origin
    FROM tract_${year} g INNER JOIN li_tract_${year} t ON g.gisjoin = t.gisjoin
    WHERE t.v00001::numeric > 0 AND t.v00002::numeric > 0`

    return dominanceQuery

  };

  function createLayer (year, varList){

    var dominanceDataQuery = new carto.source.SQL(createQuery(year, varList));

    var dominanceStyle = new carto.style.CartoCSS(`
           #layer{
             polygon-gamma: 0.5;
          ${colorStruct.map(item=>item[1]).join("\n")}
             ::outline{
               line-width: 0px;
               line-opacity: 1;
             }
           }
         `);
    var clickColumns = Array.prototype.slice.call(varList).concat(['dominant_origin', 'areaname','total_pop', 'latino_pop']);
    var dominanceLayer = new carto.layer.Layer(dominanceDataQuery, dominanceStyle, {
     featureClickColumns: clickColumns
   });

   return dominanceLayer
 };


  var pieChartData = [
    {"label" : "Puerto-Rican", "value" : 100, "color" : "#c18ce6"},
    {"label" : "South American", "value" : 100, "color" : "#dbdbdb"},
    {"label" : "Central American", "value" : 100, "color" : "#dbdbdb"},
    {"label" : "Dominican", "value" : 100, "color" : "#dbdbdb"},
    {"label" : "Mexican", "value" : 100, "color" : "#dbdbdb"},
    {"label" : "Cuban", "value" : 100, "color" : "#dbdbdb"},
    {"label" : "Other", "value" : 100, "color" : "#dbdbdb"}

  ];


  var originInfo = {
    "Puerto-Rican": {
      colorInfo: {
        h: 50,
        s: 40
      },
      tableInfo: {
        variableID: "v01001",
        alias: "pop_pr"
      }
    },
    "South American": {
      colorInfo: {
        h: 31,
        s: 88
      },
      tableInfo: {
        variableID: "v01007",
        alias: "pop_sa"
      }
    },
    "Central American": {
      colorInfo: {
        h: 106,
        s: 47
      },
      tableInfo: {
        variableID: "v01006",
        alias: "pop_ca"
      }
    },
    "Dominican": {
      colorInfo: {
        h: 248,
        s: 50
      },
      tableInfo: {
        variableID: "v01005",
        alias: "pop_dom"
      }
    },
    "Mexican": {
      colorInfo: {
        h: 204,
        s: 60
      },
      tableInfo: {
        variableID: "v01002",
        alias: "pop_mex"
      }
    },
    "Cuban": {
      colorInfo: {
        h: 345,
        s: 44
      },
      tableInfo: {
        variableID: "v01003",
        alias: "pop_cub"
      }
    },
    "Other": {
      colorInfo: {
        h: 201,
        s: 12
      },
      tableInfo: {
        variableID: "v01004",
        alias: "pop_other"
      }
    }
  };


  var rampCount = 3;


  originRamp = Array.from(Array(rampCount), (x, index) => 80 - index * 10)


  colorStruct = Object.keys(originInfo).map((originInfoKey, infoIndex) => {


    var originColor = originInfo[originInfoKey].colorInfo;

    var colorStringArray = originRamp.map((rampLightness) => hslToHex(originColor.h, originColor.s, rampLightness))

    pieChartColorStruct  =  {"label" :originInfoKey, "value" : 100, "color" :colorStringArray[parseInt(rampCount/2)] }

    var headerLeft = ($('<h4/>', {
      html: originInfoKey,
      id: 'categoryTitleLeft'
    }));

    var headerRight = ($('<h4/>', {
      html: originInfoKey,
      id: 'categoryTitleRight'
    }));

    var originListItemLeft = $('<li/>', {
      id: originInfoKey + "_left"
    });

    var originListItemRight = $('<li/>', {
      id: originInfoKey
    });

    originListItemLeft.append(originRamp.map((rampLightness, index) => {
      var hex = hslToHex(originColor.h, originColor.s, rampLightness)
      return $('<div/>', {
      class: "classBreak",
      id: `"cb${index}"`,
      style: `background-color:${hex}`
    })
  }))

    originListItemRight.append(originRamp.map((rampLightness, index) => {
      var hex = hslToHex(originColor.h, originColor.s, rampLightness)
      return $('<div/>', {
      class: "classBreak",
      id: `"cb${index}"`,
      style: `background-color:${hex}`
      })

    }))

    return [headerLeft.add(originListItemLeft),`[dominant_origin = "${originInfoKey}"]{
  polygon-fill: ramp([relative_dom], (${colorStringArray.join(',')}), jenks(${rampCount}));
}
`, pieChartColorStruct, headerRight.add(originListItemRight)]
  })


  popFactory.pieChartData= colorStruct.map(item => item[2]);

  // Use ColorStruct to Create legends
  $('#originClassesLeft').html("").append( colorStruct.map(item => item[0]));
  $('#originClassesRight').html("").append( colorStruct.map(item => item[3]));


  const varList = ['v01001', 'v01002', 'v01003', 'v01004', 'v01005', 'v01006', 'v01007'];

  const dominanceLayer2017 = createLayer(2017, varList);

  const dominanceLayer2010 = createLayer(2010, varList);

  const dominanceLayer1990 = createLayer(1990, varList);

  const li_bound_source = new carto.source.Dataset("li_bound_wgs84");

  const li_bound_style = new carto.style.CartoCSS(`
    #layer{
      polygon-fill: #FFF;
    }
    `);

  const li_bound_layer = new carto.layer.Layer(li_bound_source, li_bound_style, {
    visible: false
  });

  const li_village_source = new carto.source.Dataset('villages_hamlets_wgs84');

  const li_village_style = new carto.style.CartoCSS(`
    ##layer{
      line-color:#fff;
      line-width: 1px;
      ::labels{
        text-face-name: 'DejaVu Serif Book';
        text-name:[name];
        text-placement: point;
        text-size: 12;
        text-fill: #676767;
        text-halo-fill: #ffffff;
        text-halo-radius: 1;
      }
    }
    `);

  const li_village_layer = new carto.layer.Layer(li_village_source, li_village_style, {
    visible: false
  });

  const li_cityTown_source = new carto.source.Dataset("li_cities_towns_wgs84");

  const li_cityTown_style = new carto.style.CartoCSS(`
    #layer{
      line-color:#FFF;
      line-width: .5px;
      ::labels{
        text-face-name: 'DejaVu Serif Book';
        text-name:[name];
        text-placement: point;
        text-size: 12;
        text-fill: #676767;
        text-halo-fill: #ffffff;
        text-halo-radius: 1;
      }
    }
    `);

  const li_cityTown_layer = new carto.layer.Layer(li_cityTown_source, li_cityTown_style, {
    visible: false
  });

  const li_counties_source = new carto.source.Dataset("li_counties_wgs84");

  const li_counties_style = new carto.style.CartoCSS(`
    #layer{
      line-color:#fff;
      line-width: .5px;
      ::labels{
        text-face-name: 'DejaVu Serif Book';
        text-name:[name];
        text-placement: point;
        text-size: 16;
        text-fill: #676767;
        text-halo-fill: #ffffff;
        text-halo-radius: 1;
      }
    }
    `);

  const li_counties_layer = new carto.layer.Layer(li_counties_source, li_counties_style, {
    visible: false
  });

  // Add layers to both sides of the sliders - CV 12/13/2019
  clientLeft.addLayers([li_bound_layer, dominanceLayer2010, li_village_layer, li_cityTown_layer, li_counties_layer]);
  clientRight.addLayers([li_bound_layer, dominanceLayer2017, li_village_layer, li_cityTown_layer, li_counties_layer]);


  var dominanceL = clientLeft.getLeafletLayer().addTo(map);
  var dominanceR = clientRight.getLeafletLayer().addTo(map);
  L.control.sideBySide(dominanceL, dominanceR).addTo(map);


  // toggleLayer helps change municipal boundary layer on map
  function toggleLayer(layer) {
    switch (layer.isHidden()) {
      case true:
        // Need to move layers to index position on top
        clientLeft.moveLayer(layer, clientLeft.getLayers().length - 1);
        clientRight.moveLayer(layer,clientRight.getLayers().length - 1);
        layer.show();
        break;
      case false:
        layer.hide();
    }
  };
  //  addLayerToClient adds the specified layer to the specified client
  function addLayerToClient(client, layer) {
    // check layer is already added to client or not
    switch (client.getLayers().includes(layer)) {
      case true:
        break;
      case false:
      // if not then add the layer
        client.addLayer(layer)
        // added to make sure these layers are below any municipal boundary layers
        client.moveLayer(layer, 1);
    }
  };
  // layerChange object is used to trigger events when different layers are selected
  var layerChange = {

    layersOff: function() {
      li_cityTown_layer.hide();
      li_village_layer.hide();
      li_counties_layer.hide();
    },

    villages: function() {
      li_cityTown_layer.hide();
      li_counties_layer.hide();
      toggleLayer(li_village_layer);
    },

    cityTowns: function() {
      li_village_layer.hide();
      li_counties_layer.hide();
      toggleLayer(li_cityTown_layer);
    },

    counties: function() {
      li_village_layer.hide();
      li_cityTown_layer.hide();
      toggleLayer(li_counties_layer);
    },

    // 1960: function(client) {
    //   addLayerToClient(client, dominanceLayer1960);
    //   client.removeLayers([dominanceLayer2017, dominanceLayer2010, dominanceLayer1990, dominanceLayer1980, dominanceLayer1970]);
    // },

    // 1970: function(client) {
    //   addLayerToClient(client, dominanceLayer1970);
    //   client.removeLayers([dominanceLayer2017, dominanceLayer2010, dominanceLayer1990, dominanceLayer1980, dominanceLayer1960]);
    // },
    //
    // 1980: function(client) {
    //   addLayerToClient(client, dominanceLayer1980);
    //   client.removeLayers([dominanceLayer2017, dominanceLayer2010, dominanceLayer1990, dominanceLayer1970, dominanceLayer1960]);
    // },

    1990: function(client) {
      addLayerToClient(client, dominanceLayer1990);
      client.removeLayers([dominanceLayer2017, dominanceLayer2010]);
    },

    2010: function(client) {
      client.removeLayers([dominanceLayer2017]);
      addLayerToClient(client, dominanceLayer2010, dominanceLayer1990);
    },

    2017: function(client) {
      client.removeLayers([dominanceLayer2010]);
      addLayerToClient(client, dominanceLayer2017, dominanceLayer1990);
    }
  };

  // jQueries to hook up layer selector and radio buttons for map layer control
  $(`#layer_selector`).change(function() {
    layerChange[$(this).val()]();
  });

  $('#originLeftSelector').change(function(){
    var year = $(this).val()
    layerChange[year](clientLeft, year);
    $('#leftTitle').html(`Dominant Latino Origin by Census Tract ${year}`)

  });

  $('#originRightSelector').change(function(){
    var year = $(this).val()
    layerChange[year](clientRight);
    $('#rightTitle').html(`Dominant Latino Origin by Census Tract ${year}`)

  });

 // put in global scope for use in feature click events on map layers
  var sliderOffset = 0
  var currentMousePos = 0
  // Gets mouse and slider position, updates constantly
  $('#map').mousemove(function(event){
    currentMousePos = event.pageX
    sliderOffset = $('.leaflet-sbs-divider').offset().left;
    // Used to control layout of map as slider changes
    if(sliderOffset < 200){
      $('#leftTitle, #legendLeft').hide()
      $('#rightTitle, #legendRight').show()
      $('#rightTitle').css({"right": "37.5%", "font-size": "1rem", "top": "6%"})
    }
    if(sliderOffset > 1800 ){
      $('#rightTitle, #legendRight').hide()
      $('#leftTitle, #legendLeft').show()
      $('#leftTitle').css({"left": "34.5%", "font-size": "1rem", "top":"6%"})
    }
    if(sliderOffset > 200 && sliderOffset < 1800 ){
      $('#rightTitle, #legendRight').show()
      $('#leftTitle, #legendLeft').show()
      $('#leftTitle').css({"left": "15%", "font-size": ".75rem", "top": "5%"})
      $('#rightTitle').css({"right": "15%", "font-size": ".75rem", "top": "5%"})
    // console.log(currentMousePos + "|" + sliderOffset);
  }
  });



//   $('#map').click(function(event){
//
//     console.log('fired click')
//     console.log(currentMousePos + "|" + sliderOffset);
//     console.log(clientLeft.getLayers()[1])
//     console.log(clientRight.getLayers()[1])
//
// });

dominanceLayer1990.on('featureClicked', featureEvent => {
  if (currentMousePos > sliderOffset && clientRight.getLayers()[1] == dominanceLayer1990){
    clickedOnFeature(featureEvent)
  }

  if (currentMousePos < sliderOffset && clientLeft.getLayers()[1] == dominanceLayer1990){
    clickedOnFeature(featureEvent)
  }
});

dominanceLayer2010.on('featureClicked', featureEvent => {
  if (currentMousePos < sliderOffset && clientLeft.getLayers()[1] == dominanceLayer2010){
    clickedOnFeature(featureEvent)
  }

  if(currentMousePos > sliderOffset && clientRight.getLayers()[1] == dominanceLayer2010){
    clickedOnFeature(featureEvent)

  }
});

  dominanceLayer2017.on('featureClicked', featureEvent => {
    if (currentMousePos > sliderOffset && clientRight.getLayers()[1] == dominanceLayer2017){
      clickedOnFeature(featureEvent)
    }

    if (currentMousePos < sliderOffset && clientLeft.getLayers()[1] == dominanceLayer2017){
      clickedOnFeature(featureEvent)
    }
  });

  // switch()
  //functions removes popups that are not pinned when a new child is open
  function clickedOnFeature(featureEvent) {
    if ($('#popUpHolder').children().length > 0) {
      var popUpChildren = $('#popUpHolder').children()

      // console.log(popUpChildren.length)
      var count = popUpChildren.length;
      while (i = count--) {

        var pin = $(popUpChildren[i - 1]).find("svg")
        // console.log(i)
        // console.log($(popUpChildren[i - 1]).find("svg"))
        if (!$(pin).hasClass('pinned')) {
          $(popUpChildren[i - 1]).remove();
        }
      }
      // $('#popUpHolder').empty(); //commenting this out creates multiple pie charts

    }
    var originInfoNames= Object.keys(originInfo);
    for (index in originInfoNames){
      popFactory.pieChartData[index].value= featureEvent.data[originInfo[originInfoNames[index]].tableInfo.variableID]
    }

    var popCount = popFactory.newPopUp(featureEvent);
    $("#popUp" + popCount).css({
      "left": event.clientX + 5,
      "top": event.clientY + 5,
      "visibility": "visible"
    });




    popFactory.headerText= featureEvent.data.latino_pop;
    var pie = new d3pie("pieChart" + popCount, popFactory.pieConfig());

  };



}
