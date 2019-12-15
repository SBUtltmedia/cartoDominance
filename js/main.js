document.addEventListener("DOMContentLoaded", init);

// function reports window size used to resize when window extent changes
function reportWindowSize() {
  var elem = document.querySelector('html');
  elem.style.fontSize = `${window.innerWidth/75}px`;
}



function init() {

  reportWindowSize();

  window.onresize = reportWindowSize; //runs function each time window resizes

  const map = L.map('map', {
    doubleClickZoom: false
  }).setView([41.60, -72.95], 9);

  const bounds = L.latLngBounds([41.394543, -70.684156], [40.370698, -75.346929]);

  map.setMaxBounds(bounds);

  map.setMinZoom(8);

  map.setMaxZoom(15);

  //L.doubleClickZoom(false);

  L.tileLayer('http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {

  }).addTo(map);


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


// I started trying to make the queries more dynamic, work in progress - CV 12/13/2019
  caseBlocks = Object.keys(latinoOrigins).map((originKey) => {
    domOrigin =latinoOrigins[originKey].variableID
    origin = latinoOrigins[originKey].origin
    return [`WHEN greatest(t.v01001, t.v01002, t.v01003, t.v01004, t.v01005, t.v01006, t.v01007) = t.${domOrigin} THEN round(t.${domOrigin} ::numeric / t.v00002::numeric, 2)`,
      `WHEN greatest(t.v01001, t.v01002, t.v01003, t.v01004, t.v01005, t.v01006, t.v01007) = t.${domOrigin} THEN ${origin} `]
  });

  function createQuery(year){

    let dominanceQuery = `
    SELECT g.cartodb_id, g.gisjoin, g.the_geom, g.the_geom_webmercator, t.year,
    t.areaname, t.v00001::numeric as total_pop, t.v00002::numeric as latino_pop,
    t.v00003::numeric as non_latino_pop, t.v01001::numeric as pop_pr,
    t.v01002::numeric as pop_mex, t.v01003::numeric as pop_cub, t.v01004::numeric as pop_other,
    t.v01005::numeric as pop_dom, t.v01006::numeric as pop_ca, t.v01007::numeric as pop_sa,
    CASE
      ${caseBlocks.map(item=>item[0]).join("\n")}
    END as relative_dom,
    CASE
      ${caseBlocks.map(item=>item[1]).join("\n")}
    END as dominant_origin
    FROM tract_2017 g INNER JOIN li_tract_${year} t ON g.gisjoin = t.gisjoin
    WHERE t.v00001::numeric > 0 AND t.v00002::numeric > 0`

    return dominanceQuery

  }


  const dominanceDataQuery2017= new carto.source.SQL(createQuery(2017));

  const dominanceDataQuery2010 = new carto.source.SQL(createQuery(2010));




// Start bargraph creation; ignore this and below for now - Carl Vricella 12/3/2019
// There will be a use for this, just not yet
  // var AOI = 'New York';
  //
  //
  // const dataviewQuery = new carto.source.SQL(`
  //   SELECT d.*
  //   FROM dominance2017 d, li_cities_towns_wgs84 g
  //   WHERE ST_Within(ST_PointOnSurface(d.the_geom_webmercator), g.the_geom_webmercator) AND g.name = '${AOI}'
  //   `);
  //
  // const formulaDataview = new carto.dataview.Category(dataviewQuery, 'dominant_origin', {
  //     operation: carto.operation.COUNT, // Compute the average
  //     operationColumn: 'dominant_origin'
  //   });
  //
  // formulaDataview.on('dataChanged', data => {
  //  names = [];
  //  values = [];
  //  for (category of data.categories){
  //    values.push(category.value);
  //    names.push(category.name);
  //  }
  //  // barGraph(names);
  //
  //
  // });
  //
  // client.addDataview(formulaDataview);

// function barGraph(names){
//
//   console.log(names);
//
//   var margin = {top: 35, right: 35, bottom: 35, left: 35},
//       width = 300 - margin.left - margin.right,
//       height = 225 - margin.top - margin.bottom;
//
//   var yScale = d3.scaleLinear()
//       .range([height, 0])
//       .domain([0, 100])
//
//   var xScale = d3.scaleBand()
//       .range([0, width])
//       .domain(names)
//       .padding(0.5)
//
//   var svg = d3.select('#barGraphContainer')
//       .append("svg") // adds svgs
//       .attr("width", width + margin.left + margin.right) //sets width of svg
//       .attr("height", height + margin.top + margin.bottom) //sets height of svgs
//       .append("g")
//       .attr("transform", "translate(" + margin.left + "," + margin.top + ")" );
//
//   svg.append('g').call(d3.axisLeft(yScale));
//
//   svg.append('g').call(d3.axisBottom(xScale))
//       .attr('transform', `translate(0, ${height})`);
// };



// End bargraph creation

  // Begin creation of CSS for dominanceLayer



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
        h: 35,
        s: 44
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


// Paul could you do me a favor and comment all this out? I more or less see what's going on, but the comments would help me learn it better - CV 12/13/2019
  var rampCount = 3;
  originRamp = Array.from(Array(rampCount), (x, index) => 80 - index * 10)

  colorStruct = Object.keys(originInfo).map((originInfoKey, infoIndex) => {


    var originColor = originInfo[originInfoKey].colorInfo;

    var colorStringArray = originRamp.map((rampLightness) => hslToHex(originColor.h, originColor.s, rampLightness))

    pieChartColorStruct  =  {"label" :originInfoKey, "value" : 100, "color" :colorStringArray[parseInt(rampCount/2)] }

    var header = ($('<h4/>', {
      html: originInfoKey,
      id: 'categoryTitle'
    }));
    var originListItem = $('<li/>', {
      id: originInfoKey
    });
    originListItem.append(originRamp.map((rampLightness, index) => {
      var hex = hslToHex(originColor.h, originColor.s, rampLightness)
      return $('<div/>', {
        class: "classBreak",
        id: `"cb${index}"`,
        style: `background-color:${hex}`
      })
    }))
    return [header.add(originListItem), `[dominant_origin = "${originInfoKey}"]{
  polygon-fill: ramp([relative_dom], (${colorStringArray.join(',')}), jenks(${rampCount}));
}
`, pieChartColorStruct ]
  })


popFactory.pieChartData= colorStruct.map(item => item[2]);
  $('#originClasses').html("").append(colorStruct.map(item => item[0]))

  const dominanceStyle2017 = new carto.style.CartoCSS(`
         #layer{
           polygon-gamma: 0.5;
        ${colorStruct.map(item=>item[1]).join("\n")}
           ::outline{
             line-width: 0px;
             line-opacity: 1;
           }
         }


       `);
       const dominanceStyle2010 = new carto.style.CartoCSS(`
              #layer{
                polygon-gamma: 0.5;
             ${colorStruct.map(item=>item[1]).join("\n")}
                ::outline{
                  line-width: 0px;
                  line-opacity: 1;
                }
              }


            `);

  // end creation of CSS for dominanceLayer






  // Create Carto layers and add to map; This will need to be functionalized and/or make use of some iteration CV 12/13/2019
  const dominanceLayer2017 = new carto.layer.Layer(dominanceDataQuery2017, dominanceStyle2017, {
    featureClickColumns: ['dominant_origin', 'areaname', 'total_pop', 'pop_pr', 'pop_mex', 'pop_cub', 'pop_dom',
      'pop_sa', 'pop_ca', 'pop_other', 'non_latino_pop', 'latino_pop'
    ]
  });

  const dominanceLayer2010 = new carto.layer.Layer(dominanceDataQuery2010, dominanceStyle2010, {
    featureClickColumns: ['dominant_origin', 'areaname', 'total_pop', 'pop_pr', 'pop_mex', 'pop_cub', 'pop_dom',
      'pop_sa', 'pop_ca', 'pop_other', 'non_latino_pop', 'latino_pop'
    ]
  });

  const li_bound_source = new carto.source.Dataset("li_bound_wgs84");

  const li_bound_style = new carto.style.CartoCSS(`
    #layer{
      polygon-fill: #FFF;
    }
    `);

  const li_bound_layer = new carto.layer.Layer(li_bound_source, li_bound_style, {
    visible: false
  });

  const li_village_source = new carto.source.Dataset("li_villages_wgs84");

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


  // Start logic that controls layer selector on map in dashboard
  function toggleLayer(layer) {
    switch (layer.isHidden()) {
      case true:
        layer.show();
        break;
      case false:
        layer.hide();
    }
  };

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
    }
  };

  $(`#layer_selector`).change(function() {
    layerChange[$(this).val()]();
  });

  // End logic that controls layer selector

  // render pop up when feature of dominance layer is clicked

  var sliderOffset = 0
  var currentMousePos = 0
  $('#map').mousemove(function(event){
    currentMousePos = event.pageX
    sliderOffset = $('.leaflet-sbs-divider').offset().left;
  });

  dominanceLayer2010.on('featureClicked', featureEvent => {
    if (currentMousePos < sliderOffset){
      clickedOnFeature(featureEvent)
    }
  });

  dominanceLayer2017.on('featureClicked', featureEvent => {
    if (currentMousePos > sliderOffset){
      clickedOnFeature(featureEvent)
    }
  });


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
      popFactory.pieChartData[index].value= featureEvent.data[originInfo[originInfoNames[index]].tableInfo.alias]
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
