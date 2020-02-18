document.addEventListener("DOMContentLoaded", init);

// function reports window size, used to resize when window extent changes
function reportWindowSize() {
  var elem = document.querySelector('html');
  // changes root html font size to 3/4 of the inner screen width
  let scaleFactor = 75;
  // keep root html font size bigger for smaller screens
  if (window.innerWidth < 1440){
    scaleFactor = 62.5
  }
  elem.style.fontSize = `${window.innerWidth/scaleFactor}px`;
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

  window.onresize = reportWindowSize;


  const map = L.map('map', {
    zoomControl: false,
    doubleClickZoom: false,
    maxBoundsViscosity: 1.0
  }).setView([40.789142, -73.064961], 10);

  const bounds = L.latLngBounds([ 41.394543, -70.684156 ], [ 40.370698, -75.346929 ]);

  map.setMaxBounds(bounds);

  map.setMinZoom(8);

  map.setMaxZoom(15);

  if (window.innerWidth < 1536){
    map.setView([40.789142, -73.064961], 9)
  }

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
          s: 50
        },
        tableInfo: {
          variableID: "v01002",
          alias: "pop_mex"
        }
      },
      "Cuban": {
        colorInfo: {
          h: 0,
          s: 50
        },
        tableInfo: {
          variableID: "v01003",
          alias: "pop_cub"
        }
      },
      "Other": {
        colorInfo: {
          h: 0,
          s: 0
        },
        tableInfo: {
          variableID: "v01004",
          alias: "pop_other"
        }
      }
    };


  function createQuery(year, varList){
    varArgs = Array.prototype.slice.call(varList) // cast the variable arguments to a list again for use with list methods
    let caseBlocks = Object.keys(originInfo).map((originKey) => {
        if (varArgs.includes(originInfo[originKey].tableInfo.variableID)){
          domOrigin = originInfo[originKey].tableInfo.variableID
          return [`WHEN greatest(${varArgs.join(",")}) = t.${domOrigin} THEN round(t.${domOrigin} ::numeric / NULLIF(t.v00002,0)::numeric, 2)`,
            `WHEN greatest(${varArgs.join()}) = t.${domOrigin} THEN '${originKey}' `]
        }else{
          return ""
        }
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
    `
    return dominanceQuery

  };

  function createLayer (year, varList){

    varArgs = Array.prototype.slice.call(varList)

    var dominanceDataQuery = new carto.source.SQL(createQuery(year, varArgs));

    var dominanceStyle = new carto.style.CartoCSS(`
           #layer{
             polygon-gamma: 0.5;
             ${colorStruct.map(item=>{
               if(varArgs.includes(item[4])){
                 return item[1]
               }}).join("\n")}
             ::outline{
               line-width: .00px;
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



  var rampCount = 3;


  originRamp = Array.from(Array(rampCount), (x, index) => 80 - index * 10)


  colorStruct = Object.keys(originInfo).map((originInfoKey, infoIndex) => {


    var originColor = originInfo[originInfoKey].colorInfo;

    var colorStringArray = originRamp.map((rampLightness) => hslToHex(originColor.h, originColor.s, rampLightness))

    pieChartColorStruct  =  {"label" :originInfoKey, "value" : 100, "color" :colorStringArray[parseInt(rampCount/2)] }

    var headerLeft = ($('<h4/>', {
      html: originInfoKey,
      id: 'categoryTitleLeft_' + originInfoKey.replace(" ", "_"),
      'class': 'categoryTitleLeft'
    }));

    var headerRight = ($('<h4/>', {
      html: originInfoKey,
      id: 'categoryTitleRight_' + originInfoKey.replace(" ", "_"),
      'class': 'categoryTitleRight'
    }));

    var originListItemLeft = $('<li/>', {
      id:  originInfoKey.replace(" ", "_") + "_left"
    });

    var originListItemRight = $('<li/>', {
      id: originInfoKey.replace(" ", "_") + "_right"
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

    var variableID = originInfo[originInfoKey].tableInfo.variableID
    return [headerLeft.add(originListItemLeft),`[dominant_origin = "${originInfoKey}"]{
  polygon-fill: ramp([relative_dom], (${colorStringArray.join(',')}), equal(${rampCount}));
}
`, pieChartColorStruct, headerRight.add(originListItemRight), variableID]
  })



  popFactory.pieChartData= colorStruct.map(item => item[2]);

  // Use ColorStruct to Create legends
  const legendContentLeft = colorStruct.map(item => item[0]);
  const legendContentRight = colorStruct.map(item => item[3]);
  $('#originClassesLeft').html("").append(legendContentLeft);
  $('#originClassesRight').html("").append(legendContentRight);

// Here is where all the map layers are created, each of the main dominance layers make use of the variable list
  const varList = ['v01001', 'v01002', 'v01003', 'v01004', 'v01005', 'v01006', 'v01007'];

  const dominanceLayer2017 = createLayer(2017, varList);

  const dominanceLayer2010 = createLayer(2010, varList);

  const dominanceLayer1990 = createLayer(1990, varList);

  const dominanceLayer1980 = createLayer(1980, varList.slice(0,4));

  const dominanceLayer1970 = createLayer(1970, [varList[0], varList[3]]);

  const dominanceLayer1960 = createLayer(1960, [varList[0]]);

  // This layer is almost completely vestigal. FYI its a boundary I made by dissolving all the tract boundaries
  // It could potentially be used to better accentuate the tracts (by giving them a black outline) Problem is you would need
  // To make one for each census year as the outer boundaries change and then dynamically change it for each client
  // Its more important use however is that it allows the feature clicks on the main layers to work even when they are Below
  // the other municpal layers...silly, but I think it's a bug with carto where the bottom layer feature clicks dont work
  // don't have the time to investigate so I left as is.
  const li_bound_source = new carto.source.Dataset("tract_outer_bound");

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
      line-width: .5px;
      ::labels{
        text-face-name: 'DejaVu Serif Book';
        text-name:[e911name];
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
    visible: false, featureOverColumns: ['name']
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

 // Below was the start of a feature to allow the user to see counts of the number of census tracts dominanted
 // by each origin within a municipal boundary. It wasen't requested and I just don't have the time to finish it,
 // Left just incase someone else wants too; you can see the html alements for it commented out
 //  var muni = 'Brookhaven'
 //
 //  var query = createQuery(2010, varList);
 //
 //  const townQuery = new carto.source.SQL(`
 //    SELECT d.*
 //    FROM (${query}) d, li_cities_towns_wgs84 g
 //    WHERE ST_Within(ST_PointOnSurface(d.the_geom_webmercator), g.the_geom_webmercator) AND g.name = '${muni}'
 //    `);
 //
 //  const townDataView = new carto.dataview.Category(townQuery, 'dominant_origin', {
 //      operation: carto.operation.COUNT, // Compute the average
 //      operationColumn: 'dominant_origin'
 //    });
 //
 //  townDataView.on('dataChanged', data => {
 //   for (category of data.categories){
 //     $(`#dataViewContainer`).find(`#${category.name.replace(" ", "_")}`)
 //     .replaceWith(`<li id = '${category.name.replace(" ", "_")}'>${category.name}:${category.value}</li>`);
 //   }
 // });
 //
 // clientLeft.addDataview(townDataView);



  // Add layers to both sides of the sliders
  clientLeft.addLayers([li_bound_layer,dominanceLayer2010, li_village_layer, li_cityTown_layer, li_counties_layer]);
  clientRight.addLayers([li_bound_layer,dominanceLayer2017, li_village_layer, li_cityTown_layer, li_counties_layer]);
  for(layer of clientLeft.getLayers()){console.log(layer)};


  // call side by side with the two clients; see leaflet-side-by-side.js for more info.
  const dominanceL = clientLeft.getLeafletLayer().addTo(map);
  const dominanceR = clientRight.getLeafletLayer().addTo(map);
  L.control.sideBySide(dominanceL, dominanceR).addTo(map);


  // toggleLayer helps change municipal boundary layer on map
  // Probably wondering why this exist after looking at the below function
  // Its because addLayerToClient is dependant on the layer list being a certain length
  // Just easier to keep it like this and performance is fine.
  function toggleLayer(layer) {
    switch (layer.isHidden()) {
      case true:
        // Need to move layers to index position on top
        layer.show();
        clientLeft.moveLayer(layer, clientLeft.getLayers().length - 1);
        clientRight.moveLayer(layer,clientRight.getLayers().length - 1);
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
        var dominanceLayers = [dominanceLayer1960, dominanceLayer1970, dominanceLayer1980, dominanceLayer1990, dominanceLayer2010, dominanceLayer2017]
        // iterate through layers and see if they're loaded to the client, if so get rid of them
        for (domLayer of dominanceLayers){
          if (client.getLayers()[1] == domLayer){
          client.removeLayer(domLayer)
        }else{
          //do nothing
        }
      }
      // if not then add the layer
        client.addLayer(layer)
        // added to make sure these layers are below any municipal boundary layers
        client.moveLayer(layer, 1);
    }
  };

  // layerChange object is used to trigger events when different layers are selected
  var layerChange = {
// As stated above I choose to just show and hide the layers as it keeps the length of the array returned by carto::getLayers() constant
// This results in kind of a non-ideal effect where the layer will flicker first before hiding and showing the actual layer
    layersOff: function() {
      li_cityTown_layer.hide();
      li_village_layer.hide();
      li_counties_layer.hide();
    },

    villages: function() {
      toggleLayer(li_village_layer);
      li_cityTown_layer.hide();
      li_counties_layer.hide();
    },

    cityTowns: function() {
      toggleLayer(li_cityTown_layer);
      li_village_layer.hide();
      li_counties_layer.hide();
    },

    counties: function() {
      toggleLayer(li_counties_layer);
      li_village_layer.hide();
      li_cityTown_layer.hide();
    },
// A lot is going on here for the years and it's kind of hacky, but let me explain
// First when the {year} value is selected from the dropdown addLayerToclient is called (see above)
// Next we check which client the layer was added to, then we find and remove the elements from the correct legend
// that are no longer represented by the map layers
// Before all that however, you'll notice that the legend first needs to be recreated on the chance the previously loaded layer
// Had already modified the legend. Surprsingly this is pretty fast so I didin't go further than this.
    1960: function(client) {
      addLayerToClient(client, dominanceLayer1960);
      if(client == clientLeft){
      // $('#originClassesLeft').html("").append(legendContentLeft);
      $('#legendLeft').find('#South_American_left, #categoryTitleLeft_South_American').remove()
      $('#legendLeft').find('#Central_American_left, #categoryTitleLeft_Central_American').remove()
      $('#legendLeft').find('#Dominican_left, #categoryTitleLeft_Dominican').remove()
      $('#legendLeft').find('#Other_left, #categoryTitleLeft_Other').remove()
      $('#legendLeft').find('#Mexican_left, #categoryTitleLeft_Mexican').remove()
      $('#legendLeft').find('#Cuban_left, #categoryTitleLeft_Cuban').remove()
    } else {
      // $('#originClassesRight').html("").append(legendContentRight);
      $('#legendRight').find('#South_American_right, #categoryTitleRight_South_American').remove()
      $('#legendRight').find('#Central_American_right, #categoryTitleRight_Central_American').remove()
      $('#legendRight').find('#Dominican_right, #categoryTitleRight_Dominican').remove()
      $('#legendRight').find('#Other_right, #categoryTitleRight_Other').remove()
      $('#legendRight').find('#Mexican_right, #categoryTitleRight_Mexican').remove()
      $('#legendRight').find('#Cuban_right, #categoryTitleRight_Cuban').remove()
    }
    },

    1970: function(client) {
      addLayerToClient(client, dominanceLayer1970);
      if(client == clientLeft){
      $('#originClassesLeft').html("").append(legendContentLeft);
      $('#legendLeft').find('#South_American_left, #categoryTitleLeft_South_American').remove()
      $('#legendLeft').find('#Central_American_left, #categoryTitleLeft_Central_American').remove()
      $('#legendLeft').find('#Dominican_left, #categoryTitleLeft_Dominican').remove()
      $('#legendLeft').find('#Mexican_left, #categoryTitleLeft_Mexican').remove()
      $('#legendLeft').find('#Cuban_left, #categoryTitleLeft_Cuban').remove()
    } else {
      $('#originClassesRight').html("").append(legendContentRight);
      $('#legendRight').find('#South_American_right, #categoryTitleRight_South_American').remove()
      $('#legendRight').find('#Central_American_right, #categoryTitleRight_Central_American').remove()
      $('#legendRight').find('#Dominican_right, #categoryTitleRight_Dominican').remove()
      $('#legendRight').find('#Mexican_right, #categoryTitleRight_Mexican').remove()
      $('#legendRight').find('#Cuban_right, #categoryTitleRight_Cuban').remove()
    }
    },

    1980: function(client) {
      addLayerToClient(client, dominanceLayer1980);
      if(client == clientLeft){
      $('#originClassesLeft').html("").append(legendContentLeft);
      $('#legendLeft').find('#South_American_left, #categoryTitleLeft_South_American').remove()
      $('#legendLeft').find('#Central_American_left, #categoryTitleLeft_Central_American').remove()
      $('#legendLeft').find('#Dominican_left, #categoryTitleLeft_Dominican').remove()
    } else {
      $('#originClassesRight').html("").append(legendContentRight);
      $('#legendRight').find('#South_American_right, #categoryTitleRight_South_American').remove()
      $('#legendRight').find('#Central_American_right, #categoryTitleRight_Central_American').remove()
      $('#legendRight').find('#Dominican_right, #categoryTitleRight_Dominican').remove()
    }
    },

    1990: function(client) {
      addLayerToClient(client, dominanceLayer1990);
      if(client == clientLeft){
      $('#originClassesLeft').html("").append(legendContentLeft);
    } else {
      $('#originClassesRight').html("").append(legendContentRight);
    }
   },

    2010: function(client) {
      addLayerToClient(client, dominanceLayer2010);
      if(client == clientLeft){
      $('#originClassesLeft').html("").append(legendContentLeft);
    } else {
      $('#originClassesRight').html("").append(legendContentRight);
    }
   },

    2017: function(client) {
      addLayerToClient(client, dominanceLayer2017);
      if(client == clientLeft){
      $('#originClassesLeft').html("").append(legendContentLeft);
    } else {
      $('#originClassesRight').html("").append(legendContentRight);
    }
   }
  };




  // jQueries to hook up layer selector and radio buttons for map layer control
  $(`#layer_selector`).change(function() {
    layerChange[$(this).val()]();
  });

  $('#originLeftSelector').change(function(){
    var year = $(this).val()
    layerChange[year](clientLeft, year);
    $('#leftTitle').html(`Dominant Latino Origin <br> by Census Tract ${year}`)

  });

  $('#originRightSelector').change(function(){
    var year = $(this).val()
    layerChange[year](clientRight);
    $('#rightTitle').html(`Dominant Latino Origin <br> by Census Tract ${year}`)

  });

 // put in global scope for use in feature click events on map layers
  var sliderOffset = 0
  var currentMousePos = 0
  // Gets mouse and slider position, updates constantly
  $('#map').mousemove(function(event){
    currentMousePos = event.pageX
    sliderOffset = $('.leaflet-sbs-divider').offset().left;
    // Used to control layout of map as slider changes
    // Note that the original property set has to stay consistent since the elements are not being removed then added
    // just the css is changing so if you try to usue "top" for example and the original was "bottom"
    // It'll cause the html element to have both properties with bad side effects.
    if(sliderOffset < window.innerWidth * .2){
      $('#leftTitle, #legendLeft').hide()
      $('#rightTitle, #legendRight').show()
      $('#selector_container').css({bottom:"75%", left:"1.5%"})
      $('#rightTitle').css({"right": "38%", "font-size": "1.65rem", "bottom": "81%"})
    }
    if(sliderOffset > window.innerWidth * .9 ){
      $('#rightTitle, #legendRight').hide()
      $('#leftTitle, #legendLeft').show()
      $('#selector_container').css({bottom:"7.5%", left:"91%"})
      $('#leftTitle').css({"left": "35%", "font-size": "1.65rem", "top":"6%"})
    }
    if(sliderOffset > window.innerWidth * .2 && sliderOffset < window.innerWidth * .9 ){
      $('#rightTitle, #legendRight').show()
      $('#leftTitle, #legendLeft').show()
      $('#selector_container').css({bottom:"7.5%", left:"1%"})
      $('#leftTitle').css({"left": "15%", "font-size": "1.35rem", "top": "7.5%"})
      $('#rightTitle').css({"right": "15%", "font-size": "1.35rem", "bottom": "7.5%"})
    // console.log(currentMousePos + "|" + sliderOffset);
  }
  });


// Feature clicks for each dominance layer
dominanceLayer1960.on('featureClicked', featureEvent => {
  if (currentMousePos > sliderOffset && clientRight.getLayers()[1] == dominanceLayer1960){
    clickedOnFeature(featureEvent)
  }

  if (currentMousePos < sliderOffset && clientLeft.getLayers()[1] == dominanceLayer1960){
    clickedOnFeature(featureEvent)
  }
});

dominanceLayer1970.on('featureClicked', featureEvent => {
  if (currentMousePos > sliderOffset && clientRight.getLayers()[1] == dominanceLayer1970){
    clickedOnFeature(featureEvent)
  }

  if (currentMousePos < sliderOffset && clientLeft.getLayers()[1] == dominanceLayer1970){
    clickedOnFeature(featureEvent)
  }
});

dominanceLayer1980.on('featureClicked', featureEvent => {
  if (currentMousePos > sliderOffset && clientRight.getLayers()[1] == dominanceLayer1980){
    clickedOnFeature(featureEvent)
  }

  if (currentMousePos < sliderOffset && clientLeft.getLayers()[1] == dominanceLayer1980){
    clickedOnFeature(featureEvent)
  }
});

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
    console.log(Object.keys(originInfo));
    for (index in originInfoNames){
      popFactory.pieChartData[index].value= featureEvent.data[originInfo[originInfoNames[index]].tableInfo.variableID]
    }

    var popCount = popFactory.newPopUp(featureEvent);
    console.log(event.clientX + "|" + event.clientY)
    var xPos = event.clientX;
    var yPos = event.clientY;
    if (xPos > window.innerWidth - 500){
      xPos = xPos - 400
    }
    if (yPos > window.innerHeight - 500){
      yPos = yPos - 300
    }

    $("#popUp" + popCount).css({
      "left": xPos,
      "top": yPos,
      "visibility": "visible"
    });




    popFactory.headerText= featureEvent.data.latino_pop;
    var pie = new d3pie("pieChart" + popCount, popFactory.pieConfig());

  };

  // jQuery for splash screen

  $('<div/>', {
    id: 'splashScreen'
  }).css({
    background:  'rgb(178, 178, 178)',
    position: 'absolute',
    width: '30rem',
    height: '15rem',
    top: '30%',
    right:'30%',
    'z-index': '10',
    opacity: '.9',
    'box-shadow': `.06rem -.06rem .4rem -.03rem #302F2F,
               -.06rem .06rem .4rem -.03rem #302F2F`,
    border: ".05rem solid black",
    'font-family':"Open Sans"
  }).appendTo("body")

  $('<p/>',{
    id: 'splashScreenTextTitle',
    html:  `<br><br>Where Do Latino's Trace Their Origins Too?`,
  }).css({
    'font-family': "Merienda One",
    'text-align': 'center',
    'font-size': '1.1rem',
    'font-weight': 'bold'
  }).appendTo('#splashScreen')

  $('<p/>',{
    id: 'splashScreenText',
    html:  `Explore Census Data for Long Island's Latino Population!`
}).css({
  'text-align': 'center',
  'font-size': '.8rem',
  'font-weight': '650'
}).appendTo('#splashScreen')

$('<ul/>',{
  id: 'splashScreenList',
  html: `
  <li> Change data layers in the bottom left </li>
  <li> Use the map slider to compare different years </li>
  <li> Click on the island to bring up helpful pie charts! </li>`
}).css({
  'padding-left': '12em',
  'margin-bottom': '2em',
  'font-size': '.7rem'
}).appendTo('#splashScreen')


  $('<label />', {id: 'checkBoxLabel'}).html("check to close window").prepend(

  $('<input type = "checkbox"/>',{
    id: '#splashCheckBox'
  }).css({
  'vertical-align':'middle',
  'position': 'relative',
  'bottom': '.08em',
  'width': '.5em',
  'height': '.5em'
})).css({
  position:'absolute',
  left:"1%",
  bottom:"1%",
  'font-size': '.7rem',
  display:'block',
}).appendTo('#splashScreen')

$('<div/>', {
  id: 'overLay'
}).css({
  background:  'rgba(0, 0, 0, .30)',
  position: 'absolute',
  height: `${window.innerHeight}px`,
  width: `${window.innerWidth}px`,
  'z-index': '9'
}).appendTo("body")

 $(window).resize(function(){
   $('#overLay').css({
     height: `${window.innerHeight}px`,
     width: `${window.innerWidth}px`
   });
 });

 $("input[type=checkbox]").on("click", function(){
   $('#splashScreen').remove()
   $('#overLay').remove()
 });






}
