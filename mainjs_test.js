
var map;
document.addEventListener("DOMContentLoaded", init);

// function reports window size used to resize when window extent changes
function reportWindowSize() {

  var elem = document.querySelector('html');
  elem.style.fontSize = `${window.innerHeight/75}px`;
}


function init(){

  reportWindowSize();

  window.onresize = reportWindowSize; //runs function each time window resizes

  map = L.map('map', {doubleClickZoom:false}).setView([40.789142, -73.064961],10);

  const bounds = L.latLngBounds([ 41.394543, -70.684156 ], [ 40.370698, -75.346929 ]);

  map.setMaxBounds(bounds);

  map.setMinZoom(10);

  map.setMaxZoom(15);

  //L.doubleClickZoom(false);
  var svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svgElement.setAttribute('xmlns', "http://www.w3.org/2000/svg");
  svgElement.setAttribute('viewBox', "0 0 200 200");
  svgElement.innerHTML = '<rect width="200" height="200"/>';
  var svgElementBounds = [[  41.394543, -70.684156 ], [ 40.370698, -75.346929 ]];
  L.svgOverlay(svgElement, svgElementBounds).addTo(map);
  L.tileLayer('http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
  {}).addTo(map);

    var client = new carto.Client({
    apiKey: "6835ac33fdea1831afbabcc40bb7e09468c6945a",
    username: "latinos",
    serverUrl: "http://app2.gss.stonybrook.edu/user/latinos"
  });



  const dominanceDataQuery = new carto.source.SQL(
    `
     SELECT g.cartodb_id, g.gisjoin, g.the_geom, g.the_geom_webmercator, t.year,
     t.areaname, t.v00001::numeric as total_pop, t.v00002::numeric as latino_pop,
     t.v00003::numeric as non_latino_pop, t.v01001::numeric as pop_pr,
     t.v01002::numeric as pop_mex, t.v01003::numeric as pop_cub, t.v01004::numeric as pop_other,
     t.v01005::numeric as pop_dom, t.v01006::numeric as pop_ca, t.v01007::numeric as pop_sa,
    round( t.v00002::numeric / t.v00001::numeric * 100, 1) as pct_latino,
    round( t.v01001::numeric / t.v00001::numeric * 100, 1) as pct_pr,
    round( t.v01002::numeric / t.v00001::numeric * 100, 1) as pct_mex,
    round( t.v01003::numeric / t.v00001::numeric * 100, 1) as pct_cub,
    round( t.v01004::numeric / t.v00001::numeric * 100, 1) as pct_other,
    round( t.v01005::numeric / t.v00001::numeric * 100, 1) as pct_dom,
    round( t.v01006::numeric / t.v00001::numeric * 100, 1) as pct_ca,
    round( t.v01007::numeric / t.v00001::numeric * 100, 1) as pct_sa,
      CASE
        WHEN greatest(t.v01001, t.v01002, t.v01003, t.v01004, t.v01005, t.v01006, t.v01007) = t.v01001 THEN 'Puerto-Rican'
        WHEN greatest(t.v01001, t.v01002, t.v01003, t.v01004, t.v01005, t.v01006, t.v01007) = t.v01002 THEN 'Mexican'
        WHEN greatest(t.v01001, t.v01002, t.v01003, t.v01004, t.v01005, t.v01006, t.v01007) = t.v01003 THEN 'Cuban'
        WHEN greatest(t.v01001, t.v01002, t.v01003, t.v01004, t.v01005, t.v01006, t.v01007) = t.v01004 THEN 'Other'
        WHEN greatest(t.v01001, t.v01002, t.v01003, t.v01004, t.v01005, t.v01006, t.v01007) = t.v01005 THEN 'Dominican'
        WHEN greatest(t.v01001, t.v01002, t.v01003, t.v01004, t.v01005, t.v01006, t.v01007) = t.v01006 THEN 'Central American'
        WHEN greatest(t.v01001, t.v01002, t.v01003, t.v01004, t.v01005, t.v01006, t.v01007) = t.v01007 THEN 'South American'
      END as dominant_origin
    FROM tract_2017 g INNER JOIN li_tract_2017 t ON g.gisjoin = t.gisjoin
    WHERE t.v00001::numeric > 0

  `);


  const dominanceStyle = new carto.style.CartoCSS(`
         #layer {
           polygon-fill: ramp([dominant_origin],(#F00,#0F0,#00F,#FF0,#0FF,#F0F,#CCC),
           category(7), "=");
           polygon-opacity: .5;
           polygon-comp-op: lighten;

         }
         #layer::outline {
           line-width: 0.5;
           line-color: #FFF;
           line-opacity: 1;
         }
       `);

  const dominanceLayer = new carto.layer.Layer(dominanceDataQuery, dominanceStyle,
    {featureClickColumns: ['dominant_origin', 'pct_latino', 'pct_pr', 'pct_mex',
                           'pct_cub', 'pct_other', 'pct_ca', 'pct_sa' ,'areaname',
                           'total_pop', 'pop_pr', 'pop_mex', 'pop_cub', 'pop_dom',
                           'pop_sa', 'pop_ca', 'pop_other', 'non_latino_pop', 'latino_pop'
                         ]}
  );

  const dominanceIntensityQuery = new carto.source.SQL(`

    SELECT cartodb_id, the_geom, the_geom_webmercator, pct_pr, pct_sa, pct_ca,
    pct_cub, pct_dom, pct_mex, pct_other, pct_latino, dominant_origin,
    CASE
      WHEN dominant_origin = 'Puerto-Rican' THEN pct_pr
      WHEN dominant_origin = 'Mexican' THEN pct_mex
      WHEN dominant_origin = 'Cuban' THEN pct_cub
      WHEN dominant_origin = 'Other' THEN pct_other
      WHEN dominant_origin = 'Dominican' THEN pct_dom
      WHEN dominant_origin = 'Central American' THEN pct_ca
      WHEN dominant_origin = 'South American' THEN pct_sa
    END as intensity
    FROM dominance2017

    `);

    const intensityStyle = new carto.style.CartoCSS(`
      #layer {
        polygon-fill: ramp([intensity], colorbrewer(Greys),
        quantiles(5));
        polygon-opacity: .2;

      }
      #layer::outline {
        line-width: 0.5;
        line-color: #FFF;
        line-opacity: 1;
      }
    `);

    const intensityLayer = new carto.layer.Layer(dominanceIntensityQuery, intensityStyle);

    // #layer {
    //   polygon-fill: ramp([intensity], (#000000, #CCCCCC, #000000, #999999, #666666, #333333),
    //   quantiles(5));
    // }
    // #layer::outline {
    //   line-width: 0.5;
    //   line-color: #FFF;
    //   line-opacity: 1;
    // }

//
   //
   // client.addLayer(dominanceLayer);
   //
   // client.addLayer(intensityLayer);

   client.addLayers([intensityLayer, dominanceLayer]);

  client.getLeafletLayer().addTo(map);



//  The below commented out lines generate a leaflet popUp
//   dominanceLayer.on('featureClicked', featureEvent => {
// console.log(featureEvent)
//     var popup = L.popup();
//
//     d3.select("leaflet-popup-content-wrapper").style("background-color", "blue");
//
//     popup.setLatLng(featureEvent.latLng);
//
//     if (!popup.isOpen()){
//
//       popup.setContent(
//
//          "Dominant Origin: " + "<strong>" + featureEvent.data.dominant_origin + "</strong>"+
//          "<br> Percent Latino: " + featureEvent.data.pct_latino + "%" +
//          "<br> Percent Puerto Rican: " + featureEvent.data.pct_pr + "%" +
//          "<br> Percent Mexican: " + featureEvent.data.pct_mex + "%" +
//          "<br> Percent Cuban: " + featureEvent.data.pct_cub + "%" +
//          "<br> Percent Other: " + featureEvent.data.pct_other + "%" +
//          "<br> Percent Central American: " + featureEvent.data.pct_ca + "%" +
//          "<br> Percent South American: " + featureEvent.data.pct_sa + "%"
//
//       );
//
//       popup.openOn(map);
//
//     };
//
//   });

  // render pop up when feature of dominance layer is clicked
  dominanceLayer.on('featureClicked',(f)=>clickedOnFeature(f));

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
    var popCount =popFactory.newPopUp(featureEvent.data.areaname);
      $("#popUp" + popCount).css({
        "left" : event.clientX + 5,
        "top" : event.clientY + 5,
        "visibility" : "visible"
      });

      pieChartData["0"].value = featureEvent.data.pop_pr;
      pieChartData["1"].value = featureEvent.data.pop_mex;
      pieChartData["2"].value = featureEvent.data.pop_cub;
      pieChartData["3"].value = featureEvent.data.pop_dom;
      pieChartData["4"].value = featureEvent.data.pop_sa;
      pieChartData["5"].value = featureEvent.data.pop_ca;
      pieChartData["6"].value = featureEvent.data.pop_other;

      pieConfig.header.subtitle.text =featureEvent.data.latino_pop;
      var pie = new d3pie("pieChart" + popCount, pieConfig);
  };



  // Below gets information to create the legend and style the pie chart slices
  dominanceLayer.on('metadataChanged', function(event) {
    event.styles.forEach(function (styleMetadata) {
      switch(styleMetadata.getProperty()) {
        case 'polygon-fill':
          renderLegend(styleMetadata);
          getFeatureFill(styleMetadata);
          break;
      }
    });
  });

  function renderLegend(metadata){
    const categories = metadata.getCategories();
    for (category of categories){
      document.getElementById(category.name).innerHTML =
      `<div  class ="bullet" style="background:${category.value}"></div> ${category.name}`;
      }
    };

  function getFeatureFill(metadata){
    const categories = metadata.getCategories();
    for (category of categories){
      switch(category.name){
          case "Puerto-Rican":
            pieChartData["0"].color = category.value;
            break;
          case "Mexican":
            pieChartData["1"].color = category.value;
            break;
          case "Cuban":
            pieChartData["2"].color = category.value;
            break;
          case "Dominican":
            pieChartData["3"].color = category.value;
            break;
          case "South American":
            pieChartData["4"].color = category.value;
            break;
          case "Central American":
            pieChartData["5"].color = category.value;
            break;
          case  "Other":
            pieChartData["6"].color = category.value;
            break;
      }
    }
  };


}
