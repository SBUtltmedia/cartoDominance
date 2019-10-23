
document.addEventListener("DOMContentLoaded", init);

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
    "SELECT g.cartodb_id, g.gisjoin, g.the_geom, g.the_geom_webmercator," +
    "t.year, t.areaname, t.v00001 as total_pop, t.v00002, t.v01001, t.v01002, t.v01003," +
    "t.v01004, t.v01005, t.v01006, t.v01007, " +
    "round( t.v00002::numeric / t.v00001::numeric * 100, 1) as pct_latino, " +
    "round( t.v01001::numeric / t.v00001::numeric * 100, 1) as pct_pr, " +
    "round( t.v01002::numeric / t.v00001::numeric * 100, 1) as pct_mex, " +
    "round( t.v01003::numeric / t.v00001::numeric * 100, 1) as pct_cub, " +
    "round( t.v01004::numeric / t.v00001::numeric * 100, 1) as pct_other, " +
    "round( t.v01005::numeric / t.v00001::numeric * 100, 1) as pct_dom, " +
    "round( t.v01006::numeric / t.v00001::numeric * 100, 1) as pct_ca, " +
    "round( t.v01007::numeric / t.v00001::numeric * 100, 1) as pct_sa, " +
      "CASE " +
        "WHEN greatest(t.v01001, t.v01002, t.v01003, t.v01004, t.v01005, t.v01006, t.v01007) = t.v01001 THEN 'Puerto-Rican'" +
        "WHEN greatest(t.v01001, t.v01002, t.v01003, t.v01004, t.v01005, t.v01006, t.v01007) = t.v01002 THEN 'Mexican'" +
        "WHEN greatest(t.v01001, t.v01002, t.v01003, t.v01004, t.v01005, t.v01006, t.v01007) = t.v01003 THEN 'Cuban'" +
        "WHEN greatest(t.v01001, t.v01002, t.v01003, t.v01004, t.v01005, t.v01006, t.v01007) = t.v01004 THEN 'Dominican'" +
        "WHEN greatest(t.v01001, t.v01002, t.v01003, t.v01004, t.v01005, t.v01006, t.v01007) = t.v01005 THEN 'South American'" +
        "WHEN greatest(t.v01001, t.v01002, t.v01003, t.v01004, t.v01005, t.v01006, t.v01007) = t.v01006 THEN 'Central American'" +
        "WHEN greatest(t.v01001, t.v01002, t.v01003, t.v01004, t.v01005, t.v01006, t.v01007) = t.v01007 THEN 'Other'" +
      "END as dominant_origin " +
    "FROM tract_2017 g INNER JOIN li_tract_2017 t ON g.gisjoin = t.gisjoin " +
    "WHERE t.v00001::numeric > 0"

  );


  const dominanceStyle = new carto.style.CartoCSS(`
         #layer {
           polygon-fill: ramp([dominant_origin], cartocolor(Antique),
           category(7), "=");
           polygon-opacity: .5;
         }
         #layer::outline {
           line-width: 0.5;
           line-color: #FFF;
           line-opacity: 1;
         }
       `);
  const dominanceLayer = new carto.layer.Layer(dominanceDataQuery, dominanceStyle,
    {featureClickColumns: ['dominant_origin', 'pct_latino', 'pct_pr', 'pct_mex',
                           'pct_cub', 'pct_other', 'pct_ca', 'pct_sa' ,'areaname' ,'total_pop']}
  );



  client.addLayer(dominanceLayer);

  client.getLeafletLayer().addTo(map);

  const testDataview = new carto.dataview.Category(dominanceDataQuery, 'pct_latino');

  console.log(testDataview)


//
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

  dominanceLayer.on('featureClicked',(f)=>clickedOnFeature(f))

    // Create legend
  dominanceLayer.on('metadataChanged', function(event) {
    console.log(event)
    event.styles.forEach(function (styleMetadata) {
      console.log(styleMetadata)
      switch(styleMetadata.getProperty()) {
        case 'polygon-fill':
          console.log('case')
          renderLegend(styleMetadata);
          break;
      }
    });
  });


  function clickedOnFeature(featureEvent) {
console.log(featureEvent)

      // if ($('#popUpHolder').children().length > 0) {
      //   var popUpChildren = $('#popUpHolder').children()
      //
      //   // console.log(popUpChildren.length)
      //   var count = popUpChildren.length;
      //   while (i = count--) {
      //
      //     var pin = $(popUpChildren[i - 1]).find("svg")
      //     // console.log(i)
      //     // console.log($(popUpChildren[i - 1]).find("svg"))
      //     if (!$(pin).hasClass('pinned')) {
      //       $(popUpChildren[i - 1]).remove();
      //     }
      //   }
      //   //$('#popUpHolder').empty(); //commenting this out creates
      //   // multiple pie charts
      // }
    var popCount =popFactory.newPopUp(featureEvent.data.areaname);
console.log(popCount)
      // string param is data.censuspolygon
      $("#popUp" + popCount).css({
        "left" : event.clientX + 5,
        "top" : event.clientY + 5,
        "visibility" : "visible"
      });
      pieChartData["0"].value = featureEvent.data.pct_latino;
      pieChartData["1"].value = featureEvent.data.pct_ca;
      pieConfig.header.subtitle.text =featureEvent.data.total_pop;
      var pie = new d3pie("pieChart" + popCount, pieConfig);
console.log(pie)
  };


  function renderLegend(metadata){
    const categories = metadata.getCategories();
    for (category of categories){
      document.getElementById(category.name).innerHTML =`<div  class ="bullet" style="background:${category.value}"></div> ${category.name}`;

    }
  }

}
