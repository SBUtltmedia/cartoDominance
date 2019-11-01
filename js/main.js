
document.addEventListener("DOMContentLoaded", init);

// function reports window size used to resize when window extent changes
function reportWindowSize() {

  var elem = document.querySelector('html');
  elem.style.fontSize = `${window.innerHeight/75}px`;
}


function init(){

  reportWindowSize();

  window.onresize = reportWindowSize; //runs function each time window resizes

  const  map = L.map('map', {doubleClickZoom:false}).setView([40.789142, -73.064961],10);

  const bounds = L.latLngBounds([ 41.394543, -70.684156 ], [ 40.370698, -75.346929 ]);

  map.setMaxBounds(bounds);

  map.setMinZoom(10);

  map.setMaxZoom(15);

  //L.doubleClickZoom(false);

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
     CASE
        WHEN greatest(t.v01001, t.v01002, t.v01003, t.v01004, t.v01005, t.v01006, t.v01007) = t.v01001 THEN round( t.v01001::numeric / t.v00002::numeric, 2)
        WHEN greatest(t.v01001, t.v01002, t.v01003, t.v01004, t.v01005, t.v01006, t.v01007) = t.v01002 THEN round( t.v01002::numeric / t.v00002::numeric, 2)
        WHEN greatest(t.v01001, t.v01002, t.v01003, t.v01004, t.v01005, t.v01006, t.v01007) = t.v01003 THEN round( t.v01003::numeric / t.v00002::numeric, 2)
        WHEN greatest(t.v01001, t.v01002, t.v01003, t.v01004, t.v01005, t.v01006, t.v01007) = t.v01004 THEN round( t.v01004::numeric / t.v00002::numeric, 2)
        WHEN greatest(t.v01001, t.v01002, t.v01003, t.v01004, t.v01005, t.v01006, t.v01007) = t.v01005 THEN round( t.v01005::numeric / t.v00002::numeric, 2)
        WHEN greatest(t.v01001, t.v01002, t.v01003, t.v01004, t.v01005, t.v01006, t.v01007) = t.v01006 THEN round( t.v01006::numeric / t.v00002::numeric, 2)
        WHEN greatest(t.v01001, t.v01002, t.v01003, t.v01004, t.v01005, t.v01006, t.v01007) = t.v01007 THEN round( t.v01007::numeric / t.v00002::numeric, 2)
      END as relative_dom,
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
    WHERE t.v00001::numeric > 0 AND t.v00002::numeric > 0

  `);

  // style for dom layer; category ranks = [PR, SA, CA, DOM, MEX, Other, Cub ]
  const dominanceStyle = new carto.style.CartoCSS(`
         #layer {
           polygon-fill: ramp([dominant_origin],(#88CCEE,#967bb6,#DDCC77,#8e1600,#ff764a,#121F26,#44AA99),
           category(7), "=");
           polygon-opacity: ramp([relative_dom], (.2, .4, .6, .8, 1), jenks(5));
         }

       `);

  const dominanceLayer = new carto.layer.Layer(dominanceDataQuery, dominanceStyle,
    {featureClickColumns: ['dominant_origin', 'areaname','total_pop', 'pop_pr', 'pop_mex', 'pop_cub', 'pop_dom',
                           'pop_sa', 'pop_ca', 'pop_other', 'non_latino_pop', 'latino_pop'
                         ]}
  );

  const li_bound_source = new carto.source.Dataset("li_bound_wgs84");

  const li_bound_style = new carto.style.CartoCSS(`
    #layer{
      polygon-fill: #FFF;
    }
    `);

  const li_bound_layer = new carto.layer.Layer(li_bound_source, li_bound_style);

  client.addLayers([li_bound_layer, dominanceLayer]);

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
      `<div  class="bullet" style="background:${category.value}"></div> ${category.name}`;
      }
      document.getElementById("No Data").innerHTML =
      `<div class="bullet" style="background:#FFF"></div> No Data`;
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
